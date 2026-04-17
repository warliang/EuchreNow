import { jest } from '@jest/globals';

import {
  createGame,
  startGame,
  startNewHand,
  playerOrderUp,
  playerPassOrderUp,
  playerDealerSwap,
  playerNameTrump,
  playerPassNameTrump,
  playerPlayCard,
  scoreCurrentHand,
} from './game.js';

import { makeGameState, createBidState, makePlayers, card } from './testFixtures.js';

describe('createGame', () => {
  it('should throw an error if there are not exactly 4 players', () => {
    const players = [{ id: 'player1', name: 'Alice', hand: [], team: 0 }];
    expect(() =>
      createGame('gameid1', players, { stickTheDealer: true, goingAlone: true }),
    ).toThrow('Euchre requires exactly 4 players');
  });

  it('should create a new game with the provided players', () => {
    const game = createGame('gameid1', makePlayers(), { stickTheDealer: true, goingAlone: true });

    expect(game).toMatchObject({
      id: 'gameid1',
      phase: 'waiting',
      players: [
        { id: 'player1', name: 'Alice', hand: [], team: 0 },
        { id: 'player2', name: 'Bob', hand: [], team: 1 },
        { id: 'player3', name: 'Charlie', hand: [], team: 0 },
        { id: 'player4', name: 'Diana', hand: [], team: 1 },
      ],
      // dealerIndex: 0, // leave this out as it is randomly generated
      currentTrickIndex: 0,
      tricks: [],
      bid: null,
      score: [0, 0],
      deck: [],
      kitty: [],
      loner: null,
      settings: {
        stickTheDealer: true,
        goingAlone: true,
      },
    });
  });
});

describe('startGame', () => {
  it('should throw an error if the game has already started', () => {
    const state = makeGameState({ phase: 'dealing' });
    expect(() => startGame(state)).toThrow('Game has already started');
  });

  it('should deal cards and move to bidding', () => {
    const state = makeGameState({ phase: 'waiting' });
    const result = startGame(state);

    expect(result.phase).toBe('bidding');
    result.players.forEach((player) => {
      expect(player.hand).toHaveLength(5);
    });
    expect(result.kitty).toHaveLength(4);
    expect(result.bid).not.toBeNull();
    expect(result.bid?.phase).toBe('order-up');
  });
});

describe('startNewHand', () => {
  it('should throw an error if the game is not in the dealing phase', () => {
    const state = makeGameState({ phase: 'waiting' });
    expect(() => startNewHand(state)).toThrow('Not ready to deal new hand');
  });

  it('should deal a new hand and move to bidding', () => {
    const state = makeGameState({ phase: 'dealing' });
    const result = startNewHand(state);

    expect(result.phase).toBe('bidding');
    result.players.forEach((player) => {
      expect(player.hand).toHaveLength(5);
    });
    expect(result.kitty).toHaveLength(4);
  });
});

describe('playerDealerSwap', () => {
  it('should throw an error if player id is not the same as dealer id', () => {
    const state = makeGameState({
      phase: 'bidding',
      dealerIndex: 0,
    });

    expect(() => playerDealerSwap(state, 'player2', { suit: 'hearts', rank: 'A' })).toThrow(
      'Only the dealer can swap a card',
    );
  });

  it('should let the dealer swap a card', () => {
    const state = makeGameState({
      phase: 'dealer-swap',
      dealerIndex: 0,
      players: [
        {
          id: 'player1',
          name: 'Alice',
          team: 0,
          hand: [
            card('clubs', '9'),
            card('clubs', '10'),
            card('diamonds', '9'),
            card('diamonds', '10'),
            card('spades', '9'),
          ],
        },
        { id: 'player2', name: 'Bob', team: 1, hand: [] },
        { id: 'player3', name: 'Charlie', team: 0, hand: [] },
        { id: 'player4', name: 'Diana', team: 1, hand: [] },
      ],
      bid: createBidState({
        phase: 'done',
        trump: 'hearts',
        topCard: card('hearts', 'A'),
        maker: 'player2',
        makerTeam: 1,
      }),
    });

    const result = playerDealerSwap(state, 'player1', card('clubs', '9'));

    expect(result.phase).toBe('playing');
    expect(result.players[0]!.hand).toContainEqual(card('hearts', 'A'));
    expect(result.players[0]!.hand).not.toContainEqual(card('clubs', '9'));
  });
});

describe('invalid turn states', () => {
  const invalidTurnState = makeGameState({
    phase: 'bidding',
    bid: createBidState(),
  });

  // basically tests assertTurn in game.ts
  it('should enforce turn order across ALL player actions', () => {
    expect(() => playerOrderUp(invalidTurnState, 'player2', false)).toThrow();
    expect(() => playerPassOrderUp(invalidTurnState, 'player2')).toThrow();
    expect(() => playerNameTrump(invalidTurnState, 'player2', 'hearts', false)).toThrow();
    expect(() => playerPassNameTrump(invalidTurnState, 'player2')).toThrow();
  });
});

describe('playerPlayCard', () => {
  it("should throw an error if it is not the player's turn to play a card", () => {
    const state = makeGameState({
      phase: 'playing',
      currentTrickIndex: 0,
      tricks: [
        {
          plays: [],
          winnerId: null,
          leadSuit: null,
        },
      ],
      bid: createBidState({ phase: 'done', trump: 'hearts', maker: 'player1', makerTeam: 0 }),
    });

    expect(() => playerPlayCard(state, 'player3', { suit: 'hearts', rank: 'A' })).toThrow(
      'Not your turn - waiting for player2',
    );
  });
});

describe('scoreCurrentHand', () => {
  it('should throw an error if not in scoring phase', () => {
    const state = makeGameState({ phase: 'playing' });
    expect(() => scoreCurrentHand(state)).toThrow('Not in scoring phase');
  });
});

describe('flow tests', () => {
  beforeEach(() => {
    // ensure player1 is dealer for test consistency, and that the shuffle is deterministic for testing
    jest.spyOn(Math, 'random').mockReturnValue(0);
    /**
     * Players hands should look like:
     * player1 (dealer): 10H, JH, QD, KD, AD
     * player2: QH, KH, 9C, 10C, JC
     * player3: AH, 9D, QC, KC, AC
     * player4: 10D, JD, 9S, 10S, JS
     * Kitty: QS, KS, AS, 0H
     */
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should have correct flow from order up -> dealer swap -> playing', () => {
    let state = createGame('gameid1', makePlayers(), { stickTheDealer: true, goingAlone: true });
    state = startGame(state);

    // verify bidding starts left of dealer
    const dealer = state.players[state.dealerIndex]!;
    const firstBidder = state.players[(state.dealerIndex + 1) % state.players.length]!;

    // first bidder orders up
    state = playerOrderUp(state, firstBidder.id, false);
    expect(state.phase).toBe('dealer-swap');
    expect(state.bid?.trump).toBe('spades'); // top of kitty is QS
    expect(state.bid?.maker).toBe(firstBidder.id);

    // dealer swaps a card they hold
    const cardToSwap = dealer.hand[0]!; // 10H
    state = playerDealerSwap(state, 'player1', cardToSwap);

    expect(state.phase).toBe('playing');
    expect(state.tricks.length).toBe(1);

    // dealer should not have discarded card
    expect(state.players[state.dealerIndex]!.hand).not.toContainEqual(cardToSwap);
  });

  it('should have correct flow through passing round 1 of bidding', () => {
    let state = createGame('gameid1', makePlayers(), { stickTheDealer: false, goingAlone: true });
    state = startGame(state);

    // all players pass order up
    state = playerPassOrderUp(state, 'player2');
    state = playerPassOrderUp(state, 'player3');
    state = playerPassOrderUp(state, 'player4');
    state = playerPassOrderUp(state, 'player1');

    expect(state.bid?.phase).toBe('name-trump');
    expect(state.bid?.passCount).toBe(4);
  });

  it('should redeal if all players pass both rounds', () => {
    let state = createGame('gameid1', makePlayers(), { stickTheDealer: false, goingAlone: true });
    state = startGame(state);

    // all players pass order up
    state = playerPassOrderUp(state, 'player2');
    state = playerPassOrderUp(state, 'player3');
    state = playerPassOrderUp(state, 'player4');
    state = playerPassOrderUp(state, 'player1');

    expect(state.bid?.phase).toBe('name-trump');
    expect(state.bid?.passCount).toBe(4);

    // all players pass name trump
    state = playerPassNameTrump(state, 'player2');
    state = playerPassNameTrump(state, 'player3');
    state = playerPassNameTrump(state, 'player4');
    state = playerPassNameTrump(state, 'player1');

    expect(state.phase).toBe('dealing');
    expect(state.bid).toBeNull();
  });

  it('should stick the dealer if stickTheDealer is true and all players pass order up', () => {
    let state = createGame('gameid1', makePlayers(), { stickTheDealer: true, goingAlone: true });
    state = startGame(state);

    // all players pass order up
    state = playerPassOrderUp(state, 'player2');
    state = playerPassOrderUp(state, 'player3');
    state = playerPassOrderUp(state, 'player4');
    state = playerPassOrderUp(state, 'player1');

    // all players pass name trump
    state = playerPassNameTrump(state, 'player2');
    state = playerPassNameTrump(state, 'player3');
    state = playerPassNameTrump(state, 'player4');

    // should stick the dealer and not redeal
    expect(() => playerPassNameTrump(state, 'player1')).toThrow(
      'Stick the dealer is on — dealer must name a suit',
    );

    // dealer must name a suit (can't pick the flipped card's suit)
    const flippedSuit = state.bid!.topCard.suit;
    const validSuit = (['hearts', 'diamonds', 'clubs', 'spades'] as const).find(
      (suit) => suit !== flippedSuit,
    )!;
    state = playerNameTrump(state, 'player1', validSuit, false);

    expect(state.phase).toBe('playing');
    expect(state.bid?.trump).toBe(validSuit);
    expect(state.bid?.maker).toBe('player1');
  });
});
