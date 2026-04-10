// suits in a standard deck
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spaces'] as const;
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
	name: string;
	hand: Card[];
	team: 0 | 1; // team 0 = players 0 and 2, team 1 = players 1 and 3
};

export type Trick = {
	plays: { playerId: string; card: Card }[];
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
	loner: string | null; // player id of lone player, if any
	round: 1 | 2; // round 1 = first round of bidding, round 2 = second round of bidding if no one ordered up
	stickTheDealer: boolean; // if true, dealer must call trump in second round of bidding
};

export type GamePhase =
	| 'waiting' // waiting for players
	| 'dealing' // cards being dealt
	| 'bidding' // trump selection
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
	currentTrickIndex: number; // 0-4, 5 tricks per hand
	tricks: Trick[];
	bid: BidState | null;
	score: [number, number]; // team 0 score, team 1 score
	kitty: Card[]; // 4 cards in the kitty after dealing
	loner: string | null; // player id of lone player, if any
	settings: GameSettings;
};
