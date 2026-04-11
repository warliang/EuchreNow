import type { Card, GameState } from './types.js';

// Euchre is dealt in packets, 2 then 3
// This deals 5 cards to each player and sets aside 4 for the kitty
export const dealHands = (state: GameState): GameState => {
	if (state.phase !== 'dealing') {
		throw new Error('Not in dealing phase');
	}

	const deck = [...state.deck];
	const players = state.players.map((p) => ({ ...p, hand: [] as Card[] }));

	// Deal in two rounds per player: first 2 cards, then 3 cards
	const packets = [2, 3];

	for (const packetSize of packets) {
		for (const player of players) {
			for (let i = 0; i < packetSize; i++) {
				const card = deck.shift()!;
				player.hand.push(card);
			}
		}
	}

	// Remaining 4 cards become the kitty
	const kitty = deck.splice(0, 4);

	return {
		...state,
		players,
		kitty,
		phase: 'bidding',
		bid: {
			phase: 'order-up',
			turnIndex: (state.dealerIndex + 1) % state.players.length,
			topCard: kitty[0]!,
			trump: null,
			maker: null,
			makerTeam: null,
			loner: null,
			round: 1,
			passCount: 0,
		},
	};
};
