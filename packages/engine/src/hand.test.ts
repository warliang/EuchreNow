import { dealHands } from './hand.js';
import { createDeck } from './deck.js';
import { makeGameState } from './testFixtures.js';

// A 24-card deck dealt in 2-then-3 packets per player gives:
//   P0: deck[0,1,  8, 9,10]
//   P1: deck[2,3, 11,12,13]
//   P2: deck[4,5, 14,15,16]
//   P3: deck[6,7, 17,18,19]
//   kitty: deck[20,21,22,23]

const makeDealingState = (dealerIndex = 0) =>
  makeGameState({ phase: 'dealing', deck: createDeck(), dealerIndex });

describe('dealHands', () => {
  it('should throw when phase is not dealing', () => {
    const state = makeGameState({ phase: 'waiting', deck: createDeck() });
    expect(() => dealHands(state)).toThrow('Not in dealing phase');
  });

  it('should give each player exactly 5 cards', () => {
    const result = dealHands(makeDealingState());
    for (const player of result.players) {
      expect(player.hand).toHaveLength(5);
    }
  });

  it('should deal in 2-then-3 packet order', () => {
    const deck = createDeck();
    const result = dealHands(makeGameState({ phase: 'dealing', deck }));

    // P0 gets deck[0,1] then deck[8,9,10]
    expect(result.players[0]!.hand).toEqual([deck[0], deck[1], deck[8], deck[9], deck[10]]);
    // P1 gets deck[2,3] then deck[11,12,13]
    expect(result.players[1]!.hand).toEqual([deck[2], deck[3], deck[11], deck[12], deck[13]]);
    // P2 gets deck[4,5] then deck[14,15,16]
    expect(result.players[2]!.hand).toEqual([deck[4], deck[5], deck[14], deck[15], deck[16]]);
    // P3 gets deck[6,7] then deck[17,18,19]
    expect(result.players[3]!.hand).toEqual([deck[6], deck[7], deck[17], deck[18], deck[19]]);
  });

  it('should put the remaining 4 cards in the kitty', () => {
    const deck = createDeck();
    const result = dealHands(makeGameState({ phase: 'dealing', deck }));
    expect(result.kitty).toHaveLength(4);
    expect(result.kitty).toEqual([deck[20], deck[21], deck[22], deck[23]]);
  });

  describe('correct game state updates', () => {
    it('should set phase to bidding', () => {
      expect(dealHands(makeDealingState()).phase).toBe('bidding');
    });

    it('should set bid.phase to order-up', () => {
      expect(dealHands(makeDealingState()).bid?.phase).toBe('order-up');
    });

    it('should set bid.turnIndex to player left of dealer', () => {
      // dealerIndex 0 → turnIndex 1
      expect(dealHands(makeDealingState(0)).bid?.turnIndex).toBe(1);
      // dealerIndex 3 → turnIndex 0 (wraps)
      expect(dealHands(makeDealingState(3)).bid?.turnIndex).toBe(0);
    });

    it('should set bid.topCard to the first kitty card', () => {
      const deck = createDeck();
      const result = dealHands(makeGameState({ phase: 'dealing', deck }));
      expect(result.bid?.topCard).toEqual(result.kitty[0]);
    });

    it('should initialize bid with null trump, maker, makerTeam and zero passCount', () => {
      const bid = dealHands(makeDealingState()).bid!;
      expect(bid.trump).toBeNull();
      expect(bid.maker).toBeNull();
      expect(bid.makerTeam).toBeNull();
      expect(bid.passCount).toBe(0);
    });
  });

  it('should not mutate the original deck', () => {
    const deck = createDeck();
    const original = [...deck];
    const state = makeGameState({ phase: 'dealing', deck });
    dealHands(state);
    expect(state.deck).toEqual(original);
  });
});
