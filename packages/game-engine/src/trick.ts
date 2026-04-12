import type { GameState, Card, Trick } from './types.js';

import {
	getCurrentPlayerId,
	getEffectiveSuit,
	getPlayableCards,
	isCardMatches,
	getTotalPlayerCount,
	getCardValue,
} from './utils.js';

// Main function to play a card
export const playCard = (state: GameState, playerId: string, card: Card): GameState => {
	if (state.phase !== 'playing') {
		throw new Error('Not in playing phase');
	}

	if (!state.bid?.trump) {
		throw new Error('Trump has not been set');
	}

	const currentTrick = state.tricks[state.currentTrickIndex];

	if (!currentTrick) {
		throw new Error('No active trick');
	}

	const player = state.players.find((p) => p.id === playerId);

	if (!player) {
		throw new Error('Player not found');
	}

	// Validate it's this player's turn
	const expectedPlayerId = getCurrentPlayerId(state);
	if (!expectedPlayerId) {
		throw new Error('Cannot determine current player');
	}
	if (playerId !== expectedPlayerId) {
		throw new Error('Not your turn');
	}

	// Validate the card is legal
	const playable = getPlayableCards(player.hand, currentTrick.leadSuit, state.bid.trump);
	const isLegal = playable.some((c) => isCardMatches(c, card));

	if (!isLegal) {
		throw new Error('Card is not legal to play');
	}

	// Remove card from current player's hand
	const updatedPlayers = state.players.map((currPlayer) =>
		currPlayer.id === playerId
			? { ...currPlayer, hand: currPlayer.hand.filter((c) => !isCardMatches(c, card)) }
			: currPlayer,
	);

	// Add card to current trick
	// If this is the first card of the trick, set the lead suit
	const updatedTrick: Trick = {
		...currentTrick,
		leadSuit: currentTrick.leadSuit ?? getEffectiveSuit(card, state.bid.trump),
		plays: [...currentTrick.plays, { playerId, card }],
	};

	const updatedTricks = state.tricks.map((trick, i) =>
		i === state.currentTrickIndex ? updatedTrick : trick,
	);

	const totalPlayerCount = getTotalPlayerCount(state);
	const isTrickComplete = updatedTrick.plays.length === totalPlayerCount;

	if (isTrickComplete) {
		return resolveTrick(state, updatedTrick, updatedTricks, updatedPlayers);
	}

	return {
		...state,
		players: updatedPlayers,
		tricks: updatedTricks,
	};
};

// Determines winner of completed trick
// Updates state for next trick or scoring if this was the last trick of the hand
const resolveTrick = (
	state: GameState,
	completedTrick: Trick,
	updatedTricks: Trick[],
	updatedPlayers: typeof state.players,
): GameState => {
	const trump = state.bid!.trump!;

	// Find the winning play
	const winningPlay = completedTrick.plays.reduce((best, current) => {
		const bestValue = getCardValue(best.card, trump, completedTrick.leadSuit!);
		const currentValue = getCardValue(current.card, trump, completedTrick.leadSuit!);
		return currentValue > bestValue ? current : best;
	});

	const tricksWithWinner: Trick[] = updatedTricks.map((currTrick, i) =>
		i === state.currentTrickIndex
			? { ...completedTrick, winnerId: winningPlay.playerId }
			: currTrick,
	);

	const tricksPerHand = state.loner !== null ? 4 : 5;
	const isLastTrick = state.currentTrickIndex === tricksPerHand - 1;

	if (isLastTrick) {
		return {
			...state,
			players: updatedPlayers,
			tricks: tricksWithWinner,
			phase: 'scoring',
		};
	}

	// Start next trick — winner leads
	const nextTrickIndex = state.currentTrickIndex + 1;
	const nextTricks = [...tricksWithWinner, { plays: [], winnerId: null, leadSuit: null }];

	return {
		...state,
		players: updatedPlayers,
		tricks: nextTricks,
		currentTrickIndex: nextTrickIndex,
	};
};
