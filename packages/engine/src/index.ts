/**
 * Euchre game engine
 * Core game logic and state management for Euchre
 *
 * Application should interact with this file, never directly with individual modules like scoring.ts
 */

// Types
export type {
	GameState,
	GamePhase,
	Card,
	Player,
	Trick,
	BidState,
	GameSettings,
	Suit,
	Rank,
} from './types.js';

// Constants
export { SUITS, RANKS } from './types.js';

// Core game logic
export {
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
	checkWinner,
} from './game.js';

// Utils
export {
	getEffectiveSuit,
	getPlayableCards,
	isCardMatches,
	getTotalPlayerCount,
	getCardValue,
	getPlayerView,
} from './utils.js';
