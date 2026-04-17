import type { GameState, Suit, Card } from './types.js';

// ---------------- CARD UTILITIES ----------------

// Returns the suit of the same color
// Hearts <-> Diamonds, Clubs <-> Spades
export const getSameColorSuit = (suit: Suit): Suit => {
	const pairs: Record<Suit, Suit> = {
		hearts: 'diamonds',
		diamonds: 'hearts',
		clubs: 'spades',
		spades: 'clubs',
	};
	return pairs[suit];
};

// Returns true if the card is the Right Bower (Jack of trump)
const isRightBower = (card: Card, trump: Suit): boolean => card.rank === 'J' && card.suit === trump;

// Returns true if the card is the Left Bower (Jack of same-color suit)
const isLeftBower = (card: Card, trump: Suit): boolean =>
	card.rank === 'J' && card.suit === getSameColorSuit(trump);

// Returns the effective suit of a card accounting for the Left Bower
// Left Bower's effective suit is trump, not its actual suit
export const getEffectiveSuit = (card: Card, trump: Suit): Suit => {
	if (isLeftBower(card, trump)) return trump;
	return card.suit;
};

export const isCardMatches = (cardA: Card, cardB: Card): boolean =>
	cardA.suit === cardB.suit && cardA.rank === cardB.rank;

// Returns a numeric value for a card so we can compare them, higher is stronger
export const getCardValue = (card: Card, trump: Suit, leadSuit: Suit): number => {
	if (isRightBower(card, trump)) return 100; // highest
	if (isLeftBower(card, trump)) return 99; // second highest

	const rankValues: Record<string, number> = {
		'9': 1,
		'10': 2,
		J: 3,
		Q: 4,
		K: 5,
		A: 6,
	};

	const baseValue = rankValues[card.rank] ?? 0;

	// trump cards are always better than non-trump, even if lead suit is different
	if (getEffectiveSuit(card, trump) === trump) return 50 + baseValue; // trump cards
	if (card.suit === leadSuit) return baseValue; // lead suit
	return 0; // off suit, unplayable
};

// determines playable cards in the hand
export const getPlayableCards = (hand: Card[], leadSuit: Suit | null, trump: Suit): Card[] => {
	// First card of the trick — anything is playable
	if (leadSuit === null) return hand;

	const hasLeadSuit = hand.some((c) => getEffectiveSuit(c, trump) === leadSuit);

	// Must follow lead suit if you have it
	if (hasLeadSuit) {
		return hand.filter((c) => getEffectiveSuit(c, trump) === leadSuit);
	}

	// Can't follow suit — anything is playable
	return hand;
};

// ---------------- PLAYER UTILITIES ----------------

// Helper to get the team index of a player
export const getPlayerTeam = (state: GameState, playerId: string): 0 | 1 => {
	const index = state.players.findIndex((player) => player.id === playerId);
	if (index === -1) throw new Error(`Player ${playerId} not found`);
	return (index % 2) as 0 | 1;
};

// How many players are expected in a trick (3 if going alone, 4 otherwise)
export const getTotalPlayerCount = (state: GameState): number => (state.loner !== null ? 3 : 4);

// Returns a view of the game state filtered for a specific player
// Hides other players' hands, the deck, and the kitty
export const getPlayerView = (state: GameState, playerId: string): GameState => ({
	...state,
	players: state.players.map((currPlayer) =>
		currPlayer.id === playerId ? currPlayer : { ...currPlayer, hand: [] },
	),
	deck: [],
	kitty: [],
});

// ---------------- TURN UTILITIES ----------------
// Returns the player ID of the player whose turn it is during the current phase of game
// null if unnapplicable (e.g. waiting for players, or game over)
export const getCurrentPlayerId = (state: GameState): string | null => {
	switch (state.phase) {
		case 'bidding': {
			if (!state.bid) return null;
			return state.players[state.bid.turnIndex]?.id ?? null;
		}

		case 'dealer-swap': {
			return state.players[state.dealerIndex]?.id ?? null;
		}

		case 'playing': {
			const currentTrick = state.tricks[state.tricks.length - 1];
			if (!currentTrick) return null;

			// First card of the trick
			if (currentTrick.plays.length === 0) {
				if (state.tricks.length === 1) {
					// First trick — player left of dealer leads, skip loner's partner if sitting out
					let leadIndex = (state.dealerIndex + 1) % state.players.length;
					if (state.loner !== null) {
						const lonerIndex = state.players.findIndex((p) => p.id === state.loner);
						const partnerIndex = (lonerIndex + 2) % state.players.length;
						if (leadIndex === partnerIndex) {
							leadIndex = (leadIndex + 1) % state.players.length;
						}
					}
					return state.players[leadIndex]?.id ?? null;
				}
				// Subsequent tricks — winner of previous trick leads
				return state.tricks[state.tricks.length - 2]?.winnerId ?? null;
			}

			// Mid trick — next player clockwise, skip loner's partner
			const lastPlay = currentTrick.plays[currentTrick.plays.length - 1]!;
			let nextIndex =
				(state.players.findIndex((p) => p.id === lastPlay.playerId) + 1) % state.players.length;

			if (state.loner !== null) {
				const lonerIndex = state.players.findIndex((p) => p.id === state.loner);
				const partnerIndex = (lonerIndex + 2) % state.players.length;
				if (nextIndex === partnerIndex) {
					nextIndex = (nextIndex + 1) % state.players.length;
				}
			}

			return state.players[nextIndex]?.id ?? null;
		}

		default:
			return null;
	}
};
