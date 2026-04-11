import type { GameState, Card, Suit } from './types.js';

import { getPlayerTeam } from './utils.js';

// Round 1 — player orders up the flipped card
export const orderUp = (state: GameState, playerId: string, goAlone: boolean): GameState => {
	if (!state.bid || state.bid.phase !== 'order-up') {
		throw new Error('Not in order-up phase');
	}

	const makerTeam = getPlayerTeam(state, playerId);

	return {
		...state,
		bid: {
			...state.bid,
			phase: 'done',
			trump: state.bid.topCard.suit,
			maker: playerId,
			makerTeam,
			loner: goAlone ? playerId : null,
		},
		loner: goAlone ? playerId : null,
		phase: 'dealer-swap', // dealer must swap a card before playing starts
	};
};

// Round 1 — player passes
export const passOrderUp = (state: GameState): GameState => {
	if (!state.bid || state.bid.phase !== 'order-up') {
		throw new Error('Not in order-up phase');
	}

	const nextTurnIndex = (state.bid.turnIndex + 1) % state.players.length;
	const allPassed = nextTurnIndex === (state.dealerIndex + 1) % state.players.length;

	// All 4 players passed round 1 — move to round 2
	if (allPassed) {
		return {
			...state,
			bid: {
				...state.bid,
				phase: 'name-trump',
				turnIndex: nextTurnIndex,
				round: 2, // TODO: do i even need round if i have phases?
				passCount: state.bid.passCount + 1,
			},
		};
	}

	return {
		...state,
		bid: {
			...state.bid,
			turnIndex: nextTurnIndex,
		},
	};
};

// Dealer swaps a card after ordering up in round 1
export const dealerSwap = (state: GameState, discardCard: Card): GameState => {
	const dealer = state.players[state.dealerIndex]!;
	const topCard = state.bid?.topCard;

	if (!dealer || !topCard) {
		throw new Error('Invalid dealer swap state');
	}

	// Remove the discarded card from dealer's hand and add the top card
	const newHand = dealer.hand.filter(
		(card) => !(card.suit === discardCard.suit && card.rank === discardCard.rank),
	);
	newHand.push(topCard);

	const updatedPlayers = state.players.map((player, i) =>
		i === state.dealerIndex ? { ...player, hand: newHand } : player,
	);

	return {
		...state,
		players: updatedPlayers,
		phase: 'playing',
	};
};

// Round 2 — player names a trump suit
export const nameTrump = (
	state: GameState,
	playerId: string,
	suit: Suit,
	goAlone: boolean,
): GameState => {
	if (!state.bid || state.bid.phase !== 'name-trump') {
		throw new Error('Not in name-trump phase');
	}

	// Cannot name the suit of the flipped card
	if (suit === state.bid.topCard.suit) {
		throw new Error(`Cannot name ${suit} as trump — it was the flipped card's suit`);
	}

	const makerTeam = getPlayerTeam(state, playerId);

	return {
		...state,
		bid: {
			...state.bid,
			phase: 'done',
			trump: suit,
			maker: playerId,
			makerTeam,
			loner: goAlone ? playerId : null,
		},
		loner: goAlone ? playerId : null,
		phase: 'playing',
	};
};

// Round 2 — player passes
export const passNameTrump = (state: GameState): GameState => {
	if (!state.bid || state.bid.phase !== 'name-trump') {
		throw new Error('Not in name-trump phase');
	}

	const nextTurnIndex = (state.bid.turnIndex + 1) % state.players.length;
	const isDealer = state.bid.turnIndex === state.dealerIndex;
	const allPassed = nextTurnIndex === (state.dealerIndex + 1) % state.players.length;

	// Dealer cannot pass if stick the dealer is on
	if (isDealer && state.settings.stickTheDealer) {
		throw new Error('Stick the dealer is on — dealer must name a suit');
	}

	// All players passed round 2 — throw in the hand
	if (allPassed) {
		return {
			...state,
			phase: 'dealing', // triggers a redeal with the next dealer
			dealerIndex: (state.dealerIndex + 1) % state.players.length,
			bid: null,
		};
	}

	return {
		...state,
		bid: {
			...state.bid,
			turnIndex: nextTurnIndex,
			passCount: state.bid.passCount + 1,
		},
	};
};
