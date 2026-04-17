import type { GameState, Player, BidState, Suit, Rank, Card, Trick } from './types.js';

export const card = (suit: Suit, rank: Rank): Card => ({ suit, rank });

export const makePlayers = (): Player[] => {
  return [
    { id: 'player1', name: 'Alice', hand: [], team: 0 },
    { id: 'player2', name: 'Bob', hand: [], team: 1 },
    { id: 'player3', name: 'Charlie', hand: [], team: 0 },
    { id: 'player4', name: 'Diana', hand: [], team: 1 },
  ];
};

// Build a completed trick won by a specific team.
// team 0 → player1 wins; team 1 → player2 wins.
export const completedTrick = (
  winnerId: string | null = null,
  leadSuit: Suit | null = 'hearts',
): Trick => ({
  plays: [],
  winnerId,
  leadSuit,
});

export const createBidState = (overrides: Partial<BidState> = {}): BidState => ({
  phase: 'order-up',
  turnIndex: 0,
  topCard: card('hearts', 'A'),
  trump: null,
  maker: null,
  makerTeam: null,
  passCount: 0,
  ...overrides,
});

export const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'gameid1',
  phase: 'waiting',
  players: makePlayers(),
  dealerIndex: 0,
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
  ...overrides,
});
