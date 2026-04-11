import { SUITS, RANKS, type Card } from './types.js';

export const createDeck = (): Card[] => {
	const deck: Card[] = [];

	for (const suit of SUITS) {
		for (const rank of RANKS) {
			deck.push({ suit, rank });
		}
	}
	return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
	const shuffled = [...deck];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i]!, shuffled[j]!] = [shuffled[j]!, shuffled[i]!];
	}

	return shuffled;
};
