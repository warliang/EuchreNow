import { playCard } from './trick.js';
import { makeGameState, card, completedTrick } from './testFixtures.js';
import type { Card, GameState, Trick } from './types.js';

// Base playing state: trump=hearts, dealer=player1 (index 0), so player2 leads trick 1.
// Turn order: player2 → player3 → player4 → player1
const makePlayingState = (overrides: Partial<GameState> = {}) =>
  makeGameState({
    phase: 'playing',
    dealerIndex: 0,
    players: [
      { id: 'player1', name: 'Alice', hand: [card('spades', 'A'), card('diamonds', '9')], team: 0 },
      { id: 'player2', name: 'Bob', hand: [card('hearts', 'A'), card('clubs', '9')], team: 1 },
      { id: 'player3', name: 'Charlie', hand: [card('hearts', 'K'), card('spades', 'K')], team: 0 },
      { id: 'player4', name: 'Diana', hand: [card('hearts', 'Q'), card('diamonds', 'K')], team: 1 },
    ],
    tricks: [completedTrick(null, null)], // current trick starts empty with no winner
    currentTrickIndex: 0,
    bid: {
      phase: 'done',
      turnIndex: 1,
      topCard: card('hearts', '9'),
      trump: 'hearts',
      maker: 'player2',
      makerTeam: 1,
      passCount: 0,
    },
    ...overrides,
  });

// Simulate a complete trick by playing one card per player in turn order
const playTrick = (state: GameState, plays: { playerId: string; card: Card }[]) =>
  plays.reduce((s, { playerId, card: c }) => playCard(s, playerId, c), state);

describe('playCard validation', () => {
  it('should throw when phase is not playing', () => {
    const state = makeGameState({ phase: 'bidding' });
    expect(() => playCard(state, 'player2', card('hearts', 'A'))).toThrow('Not in playing phase');
  });

  it('should throw when trump has not been set', () => {
    const state = makePlayingState({
      bid: {
        phase: 'done',
        turnIndex: 1,
        topCard: card('hearts', '9'),
        trump: null,
        maker: 'player2',
        makerTeam: 1,
        passCount: 0,
      },
    });
    expect(() => playCard(state, 'player2', card('hearts', 'A'))).toThrow('Trump has not been set');
  });

  it('should throw when it is not the player turn', () => {
    const state = makePlayingState(); // player2's turn
    expect(() => playCard(state, 'player3', card('hearts', 'K'))).toThrow('Not your turn');
  });

  it('should throw when the card is not in the playable set (must follow suit)', () => {
    // player2 leads hearts A → player3 must follow hearts but tries spades K
    let state = makePlayingState();
    state = playCard(state, 'player2', card('hearts', 'A'));
    expect(() => playCard(state, 'player3', card('spades', 'K'))).toThrow(
      'Card is not legal to play',
    );
  });
});

describe('after a single card is played', () => {
  it('should remove the card from the player hand', () => {
    const result = playCard(makePlayingState(), 'player2', card('hearts', 'A'));
    expect(result.players[1]!.hand).not.toContainEqual(card('hearts', 'A'));
  });

  it('should add the play to the current trick', () => {
    const result = playCard(makePlayingState(), 'player2', card('hearts', 'A'));
    expect(result.tricks[0]!.plays).toHaveLength(1);
    expect(result.tricks[0]!.plays[0]).toEqual({ playerId: 'player2', card: card('hearts', 'A') });
  });

  it('should set leadSuit from the effective suit of the first card played', () => {
    const result = playCard(makePlayingState(), 'player2', card('hearts', 'A'));
    expect(result.tricks[0]!.leadSuit).toBe('hearts');
  });

  it('should set leadSuit to trump when the Left Bower is led', () => {
    // J♦ is the Left Bower when trump is hearts → effective suit is hearts
    const state = makePlayingState({
      players: [
        { id: 'player1', name: 'Alice', hand: [card('spades', 'A')], team: 0 },
        { id: 'player2', name: 'Bob', hand: [card('diamonds', 'J')], team: 1 },
        { id: 'player3', name: 'Charlie', hand: [card('hearts', 'K')], team: 0 },
        { id: 'player4', name: 'Diana', hand: [card('hearts', 'Q')], team: 1 },
      ],
    });
    const result = playCard(state, 'player2', card('diamonds', 'J'));
    expect(result.tricks[0]!.leadSuit).toBe('hearts');
  });

  it('should stay in playing phase while the trick is incomplete', () => {
    const result = playCard(makePlayingState(), 'player2', card('hearts', 'A'));
    expect(result.phase).toBe('playing');
  });

  it('should not set a winner while the trick is incomplete', () => {
    const result = playCard(makePlayingState(), 'player2', card('hearts', 'A'));
    expect(result.tricks[0]!.winnerId).toBeNull();
  });
});

describe('when a trick is completed', () => {
  // Complete trick 1: player2 leads hearts A (wins), others play non-winning cards
  const completedState = playTrick(makePlayingState(), [
    { playerId: 'player2', card: card('hearts', 'A') }, // trump A — highest
    { playerId: 'player3', card: card('hearts', 'K') }, // trump K
    { playerId: 'player4', card: card('hearts', 'Q') }, // trump Q
    { playerId: 'player1', card: card('spades', 'A') }, // off-suit — loses
  ]);

  it('should record the winning player on the completed trick', () => {
    expect(completedState.tricks[0]!.winnerId).toBe('player2');
  });

  it('should create a new empty trick for the next round', () => {
    expect(completedState.tricks).toHaveLength(2);
    expect(completedState.tricks[1]).toEqual({ plays: [], winnerId: null, leadSuit: null });
  });

  it('should increment currentTrickIndex', () => {
    expect(completedState.currentTrickIndex).toBe(1);
  });

  it('should stay in playing phase after a non-final trick', () => {
    expect(completedState.phase).toBe('playing');
  });
});

describe('trick winner determination', () => {
  const playWinnerTest = (
    plays: { playerId: string; card: Card }[],
    expectedWinner: string,
    playerHands: { id: string; name: string; hand: Card[]; team: 0 | 1 }[] = [
      { id: 'player1', name: 'Alice', hand: [plays[3]!.card], team: 0 },
      { id: 'player2', name: 'Bob', hand: [plays[0]!.card], team: 1 },
      { id: 'player3', name: 'Charlie', hand: [plays[1]!.card], team: 0 },
      { id: 'player4', name: 'Diana', hand: [plays[2]!.card], team: 1 },
    ],
  ) => {
    const state = makePlayingState({ players: playerHands });
    const result = playTrick(state, plays);
    expect(result.tricks[0]!.winnerId).toBe(expectedWinner);
  };

  it('Right Bower beats Left Bower', () => {
    playWinnerTest(
      [
        { playerId: 'player2', card: card('diamonds', 'J') }, // Left Bower (99)
        { playerId: 'player3', card: card('hearts', 'J') }, // Right Bower (100)
        { playerId: 'player4', card: card('hearts', 'Q') }, // trump Q (54)
        { playerId: 'player1', card: card('spades', 'A') }, // off-suit (0)
      ],
      'player3',
    );
  });

  it('Left Bower beats regular trump', () => {
    playWinnerTest(
      [
        { playerId: 'player2', card: card('hearts', 'A') }, // trump A (56)
        { playerId: 'player3', card: card('diamonds', 'J') }, // Left Bower (99)
        { playerId: 'player4', card: card('hearts', 'K') }, // trump K (55)
        { playerId: 'player1', card: card('spades', 'A') }, // off-suit (0)
      ],
      'player3',
    );
  });

  it('trump beats lead suit regardless of rank', () => {
    playWinnerTest(
      [
        { playerId: 'player2', card: card('spades', 'A') }, // lead suit A (6)
        { playerId: 'player3', card: card('spades', 'K') }, // lead suit K (5)
        { playerId: 'player4', card: card('hearts', '9') }, // trump 9 (51) — beats all spades
        { playerId: 'player1', card: card('diamonds', '9') }, // off-suit (0)
      ],
      'player4',
    );
  });

  it('highest lead suit card wins when no trump is played', () => {
    playWinnerTest(
      [
        { playerId: 'player2', card: card('spades', '9') }, // lead suit (1)
        { playerId: 'player3', card: card('spades', 'A') }, // lead suit (6) — wins
        { playerId: 'player4', card: card('diamonds', 'K') }, // off-suit (0)
        { playerId: 'player1', card: card('diamonds', '9') }, // off-suit (0)
      ],
      'player3',
    );
  });
});

describe('final trick of a hand', () => {
  // Build a state at trick 5 (index 4) with 4 prior completed tricks
  const priorTricks = [
    completedTrick('player2'),
    completedTrick('player3'),
    completedTrick('player4'),
    completedTrick('player1'),
  ];

  const finalTrickState = makePlayingState({
    players: [
      { id: 'player1', name: 'Alice', hand: [card('spades', 'A')], team: 0 },
      { id: 'player2', name: 'Bob', hand: [card('hearts', 'A')], team: 1 },
      { id: 'player3', name: 'Charlie', hand: [card('hearts', 'K')], team: 0 },
      { id: 'player4', name: 'Diana', hand: [card('hearts', 'Q')], team: 1 },
    ],
    tricks: [...priorTricks, { plays: [], winnerId: null, leadSuit: null }],
    currentTrickIndex: 4,
  });

  // player1 won trick 4, so player1 leads trick 5
  // lead is spades — others have no spades so they can play anything
  const afterFinalTrick = playTrick(finalTrickState, [
    { playerId: 'player1', card: card('spades', 'A') },
    { playerId: 'player2', card: card('hearts', 'A') },
    { playerId: 'player3', card: card('hearts', 'K') },
    { playerId: 'player4', card: card('hearts', 'Q') },
  ]);

  it('should move to scoring phase after the 5th trick', () => {
    expect(afterFinalTrick.phase).toBe('scoring');
  });

  it('should not add a 6th trick', () => {
    expect(afterFinalTrick.tricks).toHaveLength(5);
  });
});

describe('going alone (loner)', () => {
  // loner = player2 (index 1), partner = player4 (index 3) sits out
  // Turn order for tricks: player2 → player3 → player1
  const makeLonerState = (currentTrickIndex = 0, priorTricks: Trick[] = []) =>
    makePlayingState({
      loner: 'player2',
      players: [
        {
          id: 'player1',
          name: 'Alice',
          hand: [
            card('spades', 'A'),
            card('diamonds', '9'),
            card('clubs', 'K'),
            card('clubs', 'Q'),
          ],
          team: 0,
        },
        {
          id: 'player2',
          name: 'Bob',
          hand: [
            card('hearts', 'A'),
            card('hearts', 'K'),
            card('hearts', 'Q'),
            card('hearts', '10'),
          ],
          team: 1,
        },
        {
          id: 'player3',
          name: 'Charlie',
          hand: [
            card('spades', 'K'),
            card('spades', 'Q'),
            card('spades', '10'),
            card('spades', '9'),
          ],
          team: 0,
        },
        { id: 'player4', name: 'Diana', hand: [], team: 1 }, // sitting out
      ],
      tricks: [...priorTricks, { plays: [], winnerId: null, leadSuit: null }],
      currentTrickIndex,
    });

  it('should complete a trick with 3 plays (partner sits out)', () => {
    let state = makeLonerState();
    state = playCard(state, 'player2', card('hearts', 'A'));
    state = playCard(state, 'player3', card('spades', 'K'));
    state = playCard(state, 'player1', card('spades', 'A'));
    // Trick should be complete after 3 plays
    expect(state.tricks[0]!.winnerId).toBe('player2');
  });

  it('should move to scoring after the 4th trick', () => {
    const priorTricks = [
      completedTrick('player2'),
      completedTrick('player2'),
      completedTrick('player2'),
    ];
    let state = makeLonerState(3, priorTricks);
    state = playCard(state, 'player2', card('hearts', '10'));
    state = playCard(state, 'player3', card('spades', '9'));
    state = playCard(state, 'player1', card('clubs', 'Q'));
    expect(state.phase).toBe('scoring');
  });
});
