import type { GameState, GameSettings, Card, Suit } from './types.js';

import { createDeck, shuffleDeck } from './deck.js';
import { dealHands } from './hand.js';
import { orderUp, passOrderUp, nameTrump, passNameTrump, dealerSwap } from './bidding.js';
import { playCard } from './trick.js';
import { scoreHand, getWinner } from './scoring.js';

import { getCurrentPlayerId } from './utils.js';

const assertTurn = (state: GameState, playerId: string): void => {
	const currentPlayerId = getCurrentPlayerId(state);
	if (!currentPlayerId || currentPlayerId !== playerId) {
		throw new Error(`Not your turn - waiting for ${currentPlayerId || 'unknown player'}`);
	}
};

// Initialize new game
export const createGame = (
	id: string,
	players: { id: string; name: string }[],
	settings: GameSettings,
): GameState => {
	if (players.length !== 4) {
		throw new Error('Euchre requires exactly 4 players');
	}

	return {
		id,
		phase: 'waiting',
		players: players.map(({ id, name, ...restPlayer }, index) => ({
			...restPlayer,
			id,
			name,
			hand: [],
			team: (index % 2) as 0 | 1,
		})),
		dealerIndex: Math.floor(Math.random() * players.length), // random dealer
		currentTrickIndex: 0,
		tricks: [],
		bid: null,
		score: [0, 0],
		deck: [],
		kitty: [],
		loner: null,
		settings,
	};
};

// Start the game - deal first hand
export const startGame = (state: GameState): GameState => {
	if (state.phase !== 'waiting') {
		throw new Error('Game has already started');
	}

	const deck = shuffleDeck(createDeck());
	return dealHands({
		...state,
		deck,
		phase: 'dealing',
	});
};

// Start new hand after scoring
export const startNewHand = (state: GameState): GameState => {
	if (state.phase !== 'dealing') {
		throw new Error('Not ready to deal new hand');
	}

	const deck = shuffleDeck(createDeck());
	return dealHands({
		...state,
		deck,
	});
};

// Round 1 bidding - order up or pass
export const playerOrderUp = (state: GameState, playerId: string, goAlone: boolean): GameState => {
	assertTurn(state, playerId);
	return orderUp(state, playerId, goAlone);
};
export const playerPassOrderUp = (state: GameState, playerId: string): GameState => {
	assertTurn(state, playerId);
	return passOrderUp(state);
};

// Dealer swaps a card after being ordered up
export const playerDealerSwap = (state: GameState, playerId: string, card: Card): GameState => {
	const dealer = state.players[state.dealerIndex];
	if (dealer?.id !== playerId) {
		throw new Error('Only the dealer can swap a card');
	}
	return dealerSwap(state, card);
};

// Round 2 bidding - name trump or pass
export const playerNameTrump = (
	state: GameState,
	playerId: string,
	suit: Suit,
	goAlone: boolean,
): GameState => {
	assertTurn(state, playerId);
	return nameTrump(state, playerId, suit, goAlone);
};
export const playerPassNameTrump = (state: GameState, playerId: string): GameState => {
	assertTurn(state, playerId);
	return passNameTrump(state);
};

// Play a card during trick taking
export const playerPlayCard = (state: GameState, playerId: string, card: Card): GameState => {
	assertTurn(state, playerId);
	return playCard(state, playerId, card);
};

// Score completed hand
export const scoreCurrentHand = (state: GameState): GameState => {
	if (state.phase !== 'scoring') {
		throw new Error('Not in scoring phase');
	}

	return scoreHand(state);
};

// check game is over
export const checkWinner = (state: GameState): 0 | 1 | null => getWinner(state);
