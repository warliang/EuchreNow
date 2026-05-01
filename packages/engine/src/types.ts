// suits in a standard deck
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export type Suit = (typeof SUITS)[number];

// euchre only uses 9-Ace, might change in future to support game settings
export const RANKS = ['9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

export type Card = {
  suit: Suit;
  rank: Rank;
};

export type Player = {
  id: string;
  username: string;
  hand: Card[];
  team: 0 | 1; // team 0 = players 0 and 2, team 1 = players 1 and 3
};

export type Trick = {
  plays: { playerId: string; card: Card }[]; // can only be 0-4 plays, once it hits 5 the trick is complete and winner is determined
  winnerId: string | null;
  leadSuit: Suit | null; // suit of the first card played in the trick, used to determine who wins the trick
};

export type BidState = {
  phase: 'order-up' | 'name-trump' | 'done';
  turnIndex: number;
  topCard: Card;
  trump: Suit | null;
  maker: string | null; // player id who called trump
  makerTeam: 0 | 1 | null; // team of player who called trump
  passCount: number; // how many players have passed in the current bidding round
};

export type GamePhase =
  | 'waiting' // waiting for players
  | 'dealing' // cards being dealt
  | 'bidding' // trump selection
  | 'dealer-swap' // dealer must swap a card after order-up before play starts
  | 'playing' // tricks being played
  | 'scoring' // hand is over, tallying points
  | 'gameover'; // someone hit 10 points

export type GameSettings = {
  stickTheDealer: boolean;
  goingAlone: boolean;
};

export type GameState = {
  id: string;
  phase: GamePhase;
  players: Player[];
  dealerIndex: number;
  currentTrickIndex: number;
  tricks: Trick[];
  bid: BidState | null;
  score: [number, number]; // team 0 score, team 1 score
  deck: Card[]; // current state of the deck, used for dealing and tracking remaining cards in the kitty
  kitty: Card[]; // 4 cards in the kitty after dealing
  loner: string | null; // player id of lone player, if any
  settings: GameSettings;
};
