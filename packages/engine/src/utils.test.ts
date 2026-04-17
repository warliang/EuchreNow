import {
  getSameColorSuit,
  getEffectiveSuit,
  isCardMatches,
  getCardValue,
  getPlayableCards,
  getPlayerTeam,
  getTotalPlayerCount,
  getPlayerView,
  getCurrentPlayerId,
} from './utils.js';
import { makeGameState, card } from './testFixtures.js';
import type { Card, Trick } from './types.js';

const makeTrick = (
  plays: Trick['plays'],
  winnerId: string | null = null,
  leadSuit: Trick['leadSuit'] = null,
): Trick => ({
  plays,
  winnerId,
  leadSuit,
});

describe('getSameColorSuit', () => {
  it('hearts → diamonds', () => expect(getSameColorSuit('hearts')).toBe('diamonds'));
  it('diamonds → hearts', () => expect(getSameColorSuit('diamonds')).toBe('hearts'));
  it('clubs → spades', () => expect(getSameColorSuit('clubs')).toBe('spades'));
  it('spades → clubs', () => expect(getSameColorSuit('spades')).toBe('clubs'));
});

describe('getEffectiveSuit', () => {
  it('should return the card suit for a regular card', () => {
    expect(getEffectiveSuit(card('spades', '9'), 'hearts')).toBe('spades');
  });

  it('should return trump for the Right Bower (Jack of trump)', () => {
    expect(getEffectiveSuit(card('hearts', 'J'), 'hearts')).toBe('hearts');
  });

  it('should return trump for the Left Bower (Jack of same-color suit)', () => {
    // trump = hearts, then J♦ is hearts
    expect(getEffectiveSuit(card('diamonds', 'J'), 'hearts')).toBe('hearts');
    expect(getEffectiveSuit(card('clubs', 'J'), 'spades')).toBe('spades');
  });

  it('should return its own suit for Jack of opposite color suit', () => {
    expect(getEffectiveSuit(card('clubs', 'J'), 'hearts')).toBe('clubs');
    expect(getEffectiveSuit(card('hearts', 'J'), 'spades')).toBe('hearts');
  });
});

describe('isCardMatches', () => {
  it('should return true for identical cards', () => {
    expect(isCardMatches(card('hearts', 'A'), card('hearts', 'A'))).toBe(true);
  });

  it('should return false when suit differs', () => {
    expect(isCardMatches(card('hearts', 'A'), card('diamonds', 'A'))).toBe(false);
  });

  it('should return false when rank differs', () => {
    expect(isCardMatches(card('hearts', 'A'), card('hearts', 'K'))).toBe(false);
  });
});

describe('getCardValue', () => {
  it('should return 100 for Right Bower (Jack of trump)', () => {
    expect(getCardValue(card('hearts', 'J'), 'hearts', 'hearts')).toBe(100);
  });

  it('should return 99 for Left Bower (Jack of same-color suit)', () => {
    expect(getCardValue(card('diamonds', 'J'), 'hearts', 'hearts')).toBe(99);
  });

  it('should return 50 + rank value for trump cards', () => {
    expect(getCardValue(card('hearts', '9'), 'hearts', 'spades')).toBe(51);
    expect(getCardValue(card('hearts', '10'), 'hearts', 'spades')).toBe(52);
    expect(getCardValue(card('hearts', 'Q'), 'hearts', 'spades')).toBe(54);
    expect(getCardValue(card('hearts', 'K'), 'hearts', 'spades')).toBe(55);
    expect(getCardValue(card('hearts', 'A'), 'hearts', 'spades')).toBe(56);
  });

  it('should return rank value only for non-trump cards of the lead suit', () => {
    expect(getCardValue(card('spades', '9'), 'hearts', 'spades')).toBe(1);
    expect(getCardValue(card('spades', '10'), 'hearts', 'spades')).toBe(2);
    expect(getCardValue(card('spades', 'J'), 'hearts', 'spades')).toBe(3);
    expect(getCardValue(card('spades', 'Q'), 'hearts', 'spades')).toBe(4);
    expect(getCardValue(card('spades', 'K'), 'hearts', 'spades')).toBe(5);
    expect(getCardValue(card('spades', 'A'), 'hearts', 'spades')).toBe(6);
  });

  it('should score 0 for off-suit cards', () => {
    expect(getCardValue(card('clubs', 'A'), 'hearts', 'spades')).toBe(0);
  });

  it('should score Left Bower as trump (99) even when its actual suit matches the lead', () => {
    // J♦ is Left Bower when trump is hearts, if diamonds is somehow lead, it still scores 99
    expect(getCardValue(card('diamonds', 'J'), 'hearts', 'diamonds')).toBe(99);
  });
});

describe('getPlayableCards', () => {
  it('should return all cards when leadSuit is null (first card of trick)', () => {
    const hand = [card('hearts', 'A'), card('spades', '9'), card('clubs', 'K')];
    expect(getPlayableCards(hand, null, 'diamonds')).toEqual(hand);
  });

  it('should restrict to lead-suit cards when player has the lead suit', () => {
    const hand = [card('hearts', 'A'), card('hearts', 'K'), card('spades', '9')];
    const playable = getPlayableCards(hand, 'hearts', 'spades');
    expect(playable).toHaveLength(2);
    expect(playable).toEqual(expect.arrayContaining([card('hearts', 'A'), card('hearts', 'K')]));
  });

  it('should return all cards when player has no cards of the lead suit', () => {
    const hand = [card('clubs', 'A'), card('spades', '9')];
    const playable = getPlayableCards(hand, 'hearts', 'diamonds');
    expect(playable).toEqual(hand);
  });

  it('should require Left Bower to follow trump lead (effective suit is trump, not actual suit)', () => {
    // J♦ is Left Bower when trump is hearts — effective suit is hearts
    const hand = [card('diamonds', 'J'), card('clubs', '9')];
    const playable = getPlayableCards(hand, 'hearts', 'hearts');
    expect(playable).toEqual([card('diamonds', 'J')]);
  });

  it('should not treat Left Bower as its actual suit when following lead', () => {
    // Trump: hearts,
    // Hand: [J♦, 9♦] — only 9♦ counts as diamonds
    const hand = [card('diamonds', 'J'), card('diamonds', '9')];
    const playable = getPlayableCards(hand, 'diamonds', 'hearts');
    expect(playable).toEqual([card('diamonds', '9')]);
  });

  it('should allow Left Bower to be played freely when player has no lead suit', () => {
    // J♦ (Left Bower for hearts trump). Lead is spades, player has no spades
    const hand = [card('diamonds', 'J'), card('clubs', 'A')];
    const playable = getPlayableCards(hand, 'spades', 'hearts');
    expect(playable).toEqual(hand);
  });
});

describe('getPlayerTeam', () => {
  const state = makeGameState();

  it('should return team 0 for player at index 0', () => {
    expect(getPlayerTeam(state, 'player1')).toBe(0);
  });

  it('should return team 1 for player at index 1', () => {
    expect(getPlayerTeam(state, 'player2')).toBe(1);
  });

  it('should return team 0 for player at index 2', () => {
    expect(getPlayerTeam(state, 'player3')).toBe(0);
  });

  it('should return team 1 for player at index 3', () => {
    expect(getPlayerTeam(state, 'player4')).toBe(1);
  });

  it('should throw for unknown player id', () => {
    expect(() => getPlayerTeam(state, 'nobody')).toThrow();
  });
});

describe('getTotalPlayerCount', () => {
  it('should return 4 when no loner', () => {
    const state = makeGameState({ loner: null });
    expect(getTotalPlayerCount(state)).toBe(4);
  });

  it('should return 3 when a loner is set', () => {
    const state = makeGameState({ loner: 'player1' });
    expect(getTotalPlayerCount(state)).toBe(3);
  });
});

describe('getPlayerView', () => {
  const hand: Card[] = [card('hearts', 'A'), card('spades', '9')];
  const state = makeGameState({
    players: [
      { id: 'player1', name: 'Alice', hand, team: 0 },
      { id: 'player2', name: 'Bob', hand: [card('clubs', 'K')], team: 1 },
      { id: 'player3', name: 'Charlie', hand: [card('diamonds', '10')], team: 0 },
      { id: 'player4', name: 'Diana', hand: [card('spades', 'Q')], team: 1 },
    ],
    deck: [card('hearts', '10')],
    kitty: [card('clubs', '9')],
  });

  it("should preserve the requesting player's own hand", () => {
    const view = getPlayerView(state, 'player1');
    expect(view.players[0]!.hand).toEqual(hand);
  });

  it("should hide all other players' hands", () => {
    const view = getPlayerView(state, 'player1');
    expect(view.players[1]!.hand).toEqual([]);
    expect(view.players[2]!.hand).toEqual([]);
    expect(view.players[3]!.hand).toEqual([]);
  });

  it('should hide the deck', () => {
    const view = getPlayerView(state, 'player1');
    expect(view.deck).toEqual([]);
  });

  it('should hide the kitty', () => {
    const view = getPlayerView(state, 'player1');
    expect(view.kitty).toEqual([]);
  });

  it('should preserve all other state fields', () => {
    const view = getPlayerView(state, 'player1');
    expect(view.id).toBe(state.id);
    expect(view.phase).toBe(state.phase);
    expect(view.score).toEqual(state.score);
  });
});

describe('getCurrentPlayerId', () => {
  it('should return null for non-interactive phases', () => {
    expect(getCurrentPlayerId(makeGameState({ phase: 'waiting' }))).toBeNull();
    expect(getCurrentPlayerId(makeGameState({ phase: 'dealing' }))).toBeNull();
    expect(getCurrentPlayerId(makeGameState({ phase: 'scoring' }))).toBeNull();
    expect(getCurrentPlayerId(makeGameState({ phase: 'gameover' }))).toBeNull();
  });

  it('should return null when in bidding phase but bid is null', () => {
    const state = makeGameState({ phase: 'bidding', bid: null });
    expect(getCurrentPlayerId(state)).toBeNull();
  });

  it('should return the player at bid.turnIndex during bidding', () => {
    const state = makeGameState({
      phase: 'bidding',
      bid: {
        phase: 'order-up',
        turnIndex: 1,
        topCard: card('hearts', '9'),
        trump: null,
        maker: null,
        makerTeam: null,
        passCount: 0,
      },
    });
    // players[1] = player2 (Bob)
    expect(getCurrentPlayerId(state)).toBe('player2');
  });

  it('should return the dealer during dealer-swap phase', () => {
    const state = makeGameState({ phase: 'dealer-swap', dealerIndex: 2 });
    // players[2] = player3 (Charlie)
    expect(getCurrentPlayerId(state)).toBe('player3');
  });

  describe('playing phase', () => {
    it('should return the player left of dealer at the start of trick 1', () => {
      // dealer index 0 (player1), then player left = index 1 (player2)
      const state = makeGameState({
        phase: 'playing',
        dealerIndex: 0,
        tricks: [makeTrick([])],
        currentTrickIndex: 0,
        bid: {
          phase: 'done',
          turnIndex: 0,
          topCard: card('hearts', '9'),
          trump: 'hearts',
          maker: 'player1',
          makerTeam: 0,
          passCount: 0,
        },
      });
      expect(getCurrentPlayerId(state)).toBe('player2');
    });

    it('should return the next clockwise player mid-trick', () => {
      // player2 (index 1) just played, so next is player 3 (index 2)
      const state = makeGameState({
        phase: 'playing',
        dealerIndex: 0,
        tricks: [makeTrick([{ playerId: 'player2', card: card('hearts', '9') }], null, 'hearts')],
        currentTrickIndex: 0,
        bid: {
          phase: 'done',
          turnIndex: 0,
          topCard: card('hearts', '9'),
          trump: 'hearts',
          maker: 'player1',
          makerTeam: 0,
          passCount: 0,
        },
      });
      expect(getCurrentPlayerId(state)).toBe('player3');
    });

    it('should return the winner of the previous trick at the start of a new trick', () => {
      // trick 1 was won by player3, trick 2 just started, so player3 should lead
      const state = makeGameState({
        phase: 'playing',
        dealerIndex: 0,
        tricks: [
          makeTrick(
            [
              { playerId: 'player2', card: card('hearts', '9') },
              { playerId: 'player3', card: card('hearts', 'A') },
              { playerId: 'player4', card: card('clubs', '9') },
              { playerId: 'player1', card: card('diamonds', '9') },
            ],
            'player3',
            'hearts',
          ),
          makeTrick([]),
        ],
        currentTrickIndex: 1,
        bid: {
          phase: 'done',
          turnIndex: 0,
          topCard: card('hearts', '9'),
          trump: 'hearts',
          maker: 'player1',
          makerTeam: 0,
          passCount: 0,
        },
      });
      expect(getCurrentPlayerId(state)).toBe('player3');
    });

    it('should skip the loner partner when determining who leads trick 1', () => {
      // loner = player1 (index 0), partner = player3 (index 2)
      // dealer index 1 (player2), normal lead = index 2 (player3) = partner → skip → index 3 (player4)
      const state = makeGameState({
        phase: 'playing',
        dealerIndex: 1,
        loner: 'player1',
        tricks: [makeTrick([])],
        currentTrickIndex: 0,
        bid: {
          phase: 'done',
          turnIndex: 0,
          topCard: card('hearts', '9'),
          trump: 'hearts',
          maker: 'player1',
          makerTeam: 0,
          passCount: 0,
        },
      });
      expect(getCurrentPlayerId(state)).toBe('player4');
    });

    it('should skip the loner partner mid-trick', () => {
      // loner = player1 (index 0), partner = player3 (index 2)
      // player2 (index 1) just played → next would be index 2 (partner) → skip → index 3 (player4)
      const state = makeGameState({
        phase: 'playing',
        dealerIndex: 0,
        loner: 'player1',
        tricks: [makeTrick([{ playerId: 'player2', card: card('hearts', '9') }], null, 'hearts')],
        currentTrickIndex: 0,
        bid: {
          phase: 'done',
          turnIndex: 0,
          topCard: card('hearts', '9'),
          trump: 'hearts',
          maker: 'player1',
          makerTeam: 0,
          passCount: 0,
        },
      });
      expect(getCurrentPlayerId(state)).toBe('player4');
    });
  });
});
