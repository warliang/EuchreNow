import { createDeck, shuffleDeck } from './deck.js';

it('creates a standard deck of 24 cards', () => {
  const deck = createDeck();

  expect(deck).toHaveLength(24);
  expect(deck[0]).toEqual({ suit: 'hearts', rank: '9' }); // should be the first card
  expect(deck[deck.length - 1]).toEqual({ suit: 'spades', rank: 'A' }); // should be the last card
});

describe('shuffleDeck', () => {
  it('should shuffle a deck with same number of cards', () => {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);

    expect(shuffledDeck).toHaveLength(deck.length);
  });

  it('should contain same cards as original deck', () => {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);

    // Check that every card in the original deck is in the shuffled deck
    expect(shuffledDeck).toEqual(expect.arrayContaining(deck));
  });

  it('should not mutate the original deck', () => {
    const deck = createDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });
});
