import { scoreHand, getWinner } from './scoring.js';
import { makeGameState } from './testFixtures.js';
import type { Card, GameState, Trick } from './types.js';

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

// Build a completed trick won by a specific team.
// team 0 → player1 wins; team 1 → player2 wins.
const trickWonBy = (team: 0 | 1): Trick => ({
  plays: [],
  winnerId: team === 0 ? 'player1' : 'player2',
  leadSuit: 'hearts',
});

// Build a scoring phase state.
// tricksWon: array of 0 | 1 indicating which team wins each trick.
// makerTeam: which team called trump (default 1).
const makeScoringState = (
  tricksWon: Array<0 | 1>,
  makerTeam: 0 | 1 = 1,
  overrides: Partial<GameState> = {},
) =>
  makeGameState({
    phase: 'scoring',
    dealerIndex: 0,
    tricks: tricksWon.map(trickWonBy),
    score: [0, 0],
    bid: {
      phase: 'done',
      turnIndex: 0,
      topCard: card('hearts', '9'),
      trump: 'hearts',
      maker: makerTeam === 0 ? 'player1' : 'player2',
      makerTeam,
      passCount: 0,
    },
    ...overrides,
  });

describe('scoreHand', () => {
  it('throws when bid is null', () => {
    const state = makeGameState({ phase: 'scoring', bid: null });
    expect(() => scoreHand(state)).toThrow('No bid state found');
  });

  describe('makers win', () => {
    describe('3 of the 5 tricks', () => {
      const result = scoreHand(makeScoringState([1, 1, 1, 0, 0]));

      it('should award 1 point to the makers', () => {
        expect(result.score[1]).toBe(1);
      });

      it('should award 0 points to the defenders', () => {
        expect(result.score[0]).toBe(0);
      });
    });

    describe('4 of the 5 tricks', () => {
      const result = scoreHand(makeScoringState([1, 1, 1, 1, 0]));

      it('should award 1 point to the makers', () => {
        expect(result.score[1]).toBe(1);
      });

      it('should award 0 points to the defenders', () => {
        expect(result.score[0]).toBe(0);
      });
    });

    describe('all 5 tricks (march)', () => {
      const result = scoreHand(makeScoringState([1, 1, 1, 1, 1]));

      it('should award 2 points to the makers', () => {
        expect(result.score[1]).toBe(2);
      });

      it('should award 0 points to the defenders', () => {
        expect(result.score[0]).toBe(0);
      });
    });

    describe('euchred (makers win 0-2 tricks)', () => {
      const result = scoreHand(makeScoringState([0, 1, 0, 0, 1]));

      it('should award 2 points to the defenders', () => {
        expect(result.score[0]).toBe(2);
      });
    });
  });

  describe('loner is active', () => {
    it('should award 4 points for a march (all 5 tricks)', () => {
      const result = scoreHand(makeScoringState([1, 1, 1, 1, 1], 1, { loner: 'player2' }));
      expect(result.score[1]).toBe(4);
    });

    it('should award 1 point for winning 3-4 tricks', () => {
      const result = scoreHand(makeScoringState([1, 1, 1, 0, 0], 1, { loner: 'player2' }));
      expect(result.score[1]).toBe(1);
    });

    it('should award 2 points to defenders for euchre (winning 0-2 tricks)', () => {
      const result = scoreHand(makeScoringState([0, 1, 0, 0, 1], 1, { loner: 'player2' }));
      expect(result.score[0]).toBe(2);
    });
  });

  describe('score accumulates from prior points', () => {
    it('should add to existing score', () => {
      const state = makeScoringState([1, 1, 1, 0, 0], 1, { score: [3, 5] });
      const result = scoreHand(state);
      expect(result.score[1]).toBe(6); // 5 + 1
      expect(result.score[0]).toBe(3); // unchanged
    });
  });

  describe('state resets after scoring', () => {
    const result = scoreHand(makeScoringState([1, 1, 1, 0, 0]));

    it('should clear bid', () => expect(result.bid).toBeNull());
    it('should clear tricks', () => expect(result.tricks).toEqual([]));
    it('should reset currentTrickIndex to 0', () => expect(result.currentTrickIndex).toBe(0));
    it('should clear loner', () => expect(result.loner).toBeNull());
    it('should clear kitty', () => expect(result.kitty).toEqual([]));
    it('should clear deck', () => expect(result.deck).toEqual([]));
  });

  describe('phase transition', () => {
    it('should move to dealing when score is below 10', () => {
      const result = scoreHand(makeScoringState([1, 1, 1, 0, 0]));
      expect(result.phase).toBe('dealing');
    });

    it('should move to gameover when a team reaches 10 points', () => {
      const state = makeScoringState([1, 1, 1, 1, 1], 1, { score: [0, 9] }); // 9 + 2 = 11
      const result = scoreHand(state);
      expect(result.phase).toBe('gameover');
    });
  });

  describe('dealer rotation', () => {
    it('should rotate dealer clockwise after a normal hand', () => {
      const state = makeScoringState([1, 1, 1, 0, 0], 1, { dealerIndex: 0 });
      const result = scoreHand(state);
      expect(result.dealerIndex).toBe(1);
    });

    it('should wrap dealer rotation at 4 players', () => {
      const state = makeScoringState([1, 1, 1, 0, 0], 1, { dealerIndex: 3 });
      const result = scoreHand(state);
      expect(result.dealerIndex).toBe(0);
    });

    it('should NOT rotate dealer when the game is over', () => {
      const state = makeScoringState([1, 1, 1, 1, 1], 1, { score: [0, 9], dealerIndex: 2 });
      const result = scoreHand(state);
      expect(result.dealerIndex).toBe(2);
    });
  });
});

describe('getWinner', () => {
  it('should return null when phase is not gameover', () => {
    expect(getWinner(makeGameState({ phase: 'playing' }))).toBeNull();
    expect(getWinner(makeGameState({ phase: 'scoring' }))).toBeNull();
  });

  it('should return 0 when team 0 has 10+ points', () => {
    const state = makeGameState({ phase: 'gameover', score: [10, 7] });
    expect(getWinner(state)).toBe(0);
  });

  it('should return 1 when team 1 has 10+ points', () => {
    const state = makeGameState({ phase: 'gameover', score: [4, 11] });
    expect(getWinner(state)).toBe(1);
  });
});
