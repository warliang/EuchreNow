import { orderUp, passOrderUp, dealerSwap, nameTrump, passNameTrump } from './bidding.js';
import { makeGameState, card } from './testFixtures.js';
import type { GameState } from './types.js';

const TOP_CARD = card('hearts', '9');

// State with bid phase 'order-up', dealer=0, first bidder=player2 (index 1)
const makeOrderUpState = (overrides: Partial<GameState> = {}) =>
  makeGameState({
    phase: 'bidding',
    dealerIndex: 0,
    bid: {
      phase: 'order-up',
      turnIndex: 1,
      topCard: TOP_CARD,
      trump: null,
      maker: null,
      makerTeam: null,
      passCount: 0,
    },
    ...overrides,
  });

// State with bid phase 'name-trump', dealer=0, first bidder=player2 (index 1)
const makeNameTrumpState = (overrides: Partial<GameState> = {}) =>
  makeGameState({
    phase: 'bidding',
    dealerIndex: 0,
    bid: {
      phase: 'name-trump',
      turnIndex: 1,
      topCard: TOP_CARD,
      trump: null,
      maker: null,
      makerTeam: null,
      passCount: 4,
    },
    ...overrides,
  });

describe('orderUp', () => {
  it('should throw when not in order-up phase', () => {
    const state = makeNameTrumpState();
    expect(() => orderUp(state, 'player2', false)).toThrow('Not in order-up phase');
  });

  it('should set trump to the top card suit', () => {
    const result = orderUp(makeOrderUpState(), 'player2', false);
    expect(result.bid?.trump).toBe('hearts');
  });

  it('should set maker to the ordering player', () => {
    const result = orderUp(makeOrderUpState(), 'player2', false);
    expect(result.bid?.maker).toBe('player2');
  });

  it('should set makerTeam based on ordering player position', () => {
    // player2 is index 1 → team 1
    const result = orderUp(makeOrderUpState(), 'player2', false);
    expect(result.bid?.makerTeam).toBe(1);
  });

  it('should move to dealer-swap phase', () => {
    const result = orderUp(makeOrderUpState(), 'player2', false);
    expect(result.phase).toBe('dealer-swap');
  });

  it('should set loner when goAlone is true', () => {
    const result = orderUp(makeOrderUpState(), 'player2', true);
    expect(result.loner).toBe('player2');
  });

  it('should set loner to null when goAlone is false', () => {
    const result = orderUp(makeOrderUpState(), 'player2', false);
    expect(result.loner).toBeNull();
  });

  it('should throw when going alone is disabled in settings', () => {
    const state = makeOrderUpState({ settings: { stickTheDealer: true, goingAlone: false } });
    expect(() => orderUp(state, 'player2', true)).toThrow('Going alone is not enabled');
  });
});

describe('passOrderUp', () => {
  it('should throw when not in order-up phase', () => {
    const state = makeNameTrumpState();
    expect(() => passOrderUp(state)).toThrow('Not in order-up phase');
  });

  it('should advance turnIndex to the next player', () => {
    const result = passOrderUp(makeOrderUpState()); // turnIndex 1 → 2
    expect(result.bid?.turnIndex).toBe(2);
  });

  it('should increment passCount', () => {
    const result = passOrderUp(makeOrderUpState()); // passCount 0 → 1
    expect(result.bid?.passCount).toBe(1);
  });

  it('should stay in order-up after one pass', () => {
    const result = passOrderUp(makeOrderUpState());
    expect(result.bid?.phase).toBe('order-up');
  });

  describe('all players pass', () => {
    let state: GameState;
    beforeEach(() => {
      state = makeOrderUpState();
      state = passOrderUp(state); // 1 → 2
      state = passOrderUp(state); // 2 → 3
      state = passOrderUp(state); // 3 → 0
      state = passOrderUp(state); // 0 → 1 (wraps = allPassed)
    });

    it('should move to name-trump after all 4 players pass', () => {
      expect(state.bid?.phase).toBe('name-trump');
    });

    it('should wrap turnIndex back to index 1', () => {
      expect(state.bid?.turnIndex).toBe(1);
    });
  });
});

describe('dealerSwap', () => {
  const DEALER_HAND = [card('spades', 'A'), card('clubs', 'K'), card('diamonds', 'Q')];
  const DISCARD = DEALER_HAND[0]!;

  // dealer is player1 (index 0)
  const makeDealerSwapState = () =>
    makeGameState({
      phase: 'dealer-swap',
      dealerIndex: 0,
      players: [
        { id: 'player1', name: 'Alice', hand: DEALER_HAND, team: 0 },
        { id: 'player2', name: 'Bob', hand: [], team: 1 },
        { id: 'player3', name: 'Charlie', hand: [], team: 0 },
        { id: 'player4', name: 'Diana', hand: [], team: 1 },
      ],
      bid: {
        phase: 'done',
        turnIndex: 1,
        topCard: TOP_CARD,
        trump: 'hearts',
        maker: 'player2',
        makerTeam: 1,
        passCount: 0,
      },
    });

  it('should remove the discarded card from the dealer hand', () => {
    const result = dealerSwap(makeDealerSwapState(), DISCARD);
    expect(result.players[0]!.hand).not.toContainEqual(DISCARD);
  });

  it('should add the top card to the dealer hand', () => {
    const result = dealerSwap(makeDealerSwapState(), DISCARD);
    expect(result.players[0]!.hand).toContainEqual(TOP_CARD);
  });

  it('should keep dealer hand at 3 cards after swap', () => {
    const result = dealerSwap(makeDealerSwapState(), DISCARD);
    expect(result.players[0]!.hand).toHaveLength(3); // started with 3, swap keeps count
  });

  it('should move to playing phase', () => {
    const result = dealerSwap(makeDealerSwapState(), DISCARD);
    expect(result.phase).toBe('playing');
  });

  it('should initialize an empty first trick', () => {
    const result = dealerSwap(makeDealerSwapState(), DISCARD);
    expect(result.tricks).toHaveLength(1);
    expect(result.tricks[0]).toEqual({ plays: [], winnerId: null, leadSuit: null });
  });

  it('should set currentTrickIndex to 0', () => {
    const result = dealerSwap(makeDealerSwapState(), DISCARD);
    expect(result.currentTrickIndex).toBe(0);
  });

  it('should throw when the discarded card is not in the dealer hand', () => {
    const state = makeDealerSwapState();
    expect(() => dealerSwap(state, card('hearts', 'A'))).toThrow(
      'Discard card not found in dealer hand',
    );
  });
});

describe('nameTrump', () => {
  it('should throw when not in name-trump phase', () => {
    const state = makeOrderUpState();
    expect(() => nameTrump(state, 'player2', 'spades', false)).toThrow('Not in name-trump phase');
  });

  it('should throw when naming the flipped card suit', () => {
    const state = makeNameTrumpState(); // topCard is hearts
    expect(() => nameTrump(state, 'player2', 'hearts', false)).toThrow();
  });

  it('should set trump to the named suit', () => {
    const result = nameTrump(makeNameTrumpState(), 'player2', 'spades', false);
    expect(result.bid?.trump).toBe('spades');
  });

  it('should set maker and makerTeam', () => {
    const result = nameTrump(makeNameTrumpState(), 'player2', 'spades', false);
    expect(result.bid?.maker).toBe('player2');
    expect(result.bid?.makerTeam).toBe(1); // player2 = index 1 = team 1
  });

  it('should move to playing phase', () => {
    const result = nameTrump(makeNameTrumpState(), 'player2', 'spades', false);
    expect(result.phase).toBe('playing');
  });

  it('should initialize an empty first trick', () => {
    const result = nameTrump(makeNameTrumpState(), 'player2', 'spades', false);
    expect(result.tricks).toHaveLength(1);
    expect(result.tricks[0]).toEqual({ plays: [], winnerId: null, leadSuit: null });
  });

  it('should set loner when goAlone is true', () => {
    const result = nameTrump(makeNameTrumpState(), 'player2', 'spades', true);
    expect(result.loner).toBe('player2');
  });

  it('should throw when going alone is disabled', () => {
    const state = makeNameTrumpState({ settings: { stickTheDealer: true, goingAlone: false } });
    expect(() => nameTrump(state, 'player2', 'spades', true)).toThrow('Going alone is not enabled');
  });
});

describe('passNameTrump', () => {
  it('should throw when not in name-trump phase', () => {
    const state = makeOrderUpState();
    expect(() => passNameTrump(state)).toThrow('Not in name-trump phase');
  });

  it('should advance turnIndex and increment passCount', () => {
    const result = passNameTrump(makeNameTrumpState()); // turnIndex 1 → 2
    expect(result.bid?.turnIndex).toBe(2);
    expect(result.bid?.passCount).toBe(5);
  });

  it('should throw when dealer tries to pass with stick-the-dealer on', () => {
    // Make it the dealer's turn (dealerIndex=0, turnIndex=0)
    const state = makeNameTrumpState({
      bid: {
        phase: 'name-trump',
        turnIndex: 0,
        topCard: TOP_CARD,
        trump: null,
        maker: null,
        makerTeam: null,
        passCount: 3,
      },
      settings: { stickTheDealer: true, goingAlone: true },
    });
    expect(() => passNameTrump(state)).toThrow('Stick the dealer');
  });

  describe('stickTheDealer off', () => {
    let state: GameState;
    beforeEach(() => {
      state = makeNameTrumpState({ settings: { stickTheDealer: false, goingAlone: true } });
      // Simulate all passing
      state = passNameTrump(state); // 1 → 2
      state = passNameTrump(state); // 2 → 3
      state = passNameTrump(state); // 3 → 0
      state = passNameTrump(state); // 0 → 1 (wraps = allPassed)
    });

    it('should throw in the hand when all players pass (stickTheDealer off)', () => {
      expect(state.phase).toBe('dealing');
    });

    it('should advance dealer index when throwing in the hand', () => {
      expect(state.dealerIndex).toBe(1);
    });

    it('should clear bid state when throwing in the hand', () => {
      expect(state.bid).toBeNull();
    });
  });
});
