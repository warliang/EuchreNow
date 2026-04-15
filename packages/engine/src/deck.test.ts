import { createDeck, shuffleDeck } from './deck.js';

it('creates a standard deck of 24 cards', () => {
	const deck = createDeck();

	expect(deck).toHaveLength(24);
	expect(deck[0]).toEqual({ suit: 'hearts', rank: '9' }); // should be the first card
	expect(deck[deck.length - 1]).toEqual({ suit: 'spades', rank: 'A' }); // should be the last card
});

it('shuffles the deck', () => {
	const deck = createDeck();
	const shuffledDeck = shuffleDeck(deck);

	expect(shuffledDeck).toHaveLength(24);
	expect(shuffledDeck).not.toEqual(deck); // very low probability of being the same order
	expect(new Set(shuffledDeck)).toEqual(new Set(deck)); // should contain the same cards
});
