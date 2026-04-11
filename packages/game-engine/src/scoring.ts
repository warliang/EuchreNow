import type { GameState } from './types.js';

// Count how many tricks each team won this hand
const countTricksWon = (state: GameState): [number, number] => {
	const counts: [number, number] = [0, 0];

	for (const trick of state.tricks) {
		// Skip the active trick if it has no winner yet
		if (trick.winnerId === null) continue;

		const winner = state.players.find((p) => p.id === trick.winnerId);
		if (!winner) continue;

		counts[winner.team]++;
	}

	return counts;
};

export const scoreHand = (state: GameState): GameState => {
	if (!state.bid) {
		throw new Error('No bid state found');
	}

	const { maker, makerTeam, loner } = state.bid;

	if (maker === null || makerTeam === null) {
		throw new Error('No maker found');
	}

	const defenderTeam = makerTeam === 0 ? 1 : 0;
	const [team0Tricks, team1Tricks] = countTricksWon(state);
	const makerTricks = makerTeam === 0 ? team0Tricks : team1Tricks;

	const isLoner = loner !== null;
	const TRICKS_PER_HAND = isLoner ? 4 : 5;

	let pointsEarned = 0;
	let teamEarned = makerTeam;

	if (makerTricks < 3) {
		// Euchred — defenders get 2 points
		pointsEarned = 2;
		teamEarned = defenderTeam;
	} else if (makerTricks === TRICKS_PER_HAND) {
		// Won all tricks — march or loner
		pointsEarned = isLoner ? 4 : 2;
		teamEarned = makerTeam;
	} else {
		// Won 3 or 4 tricks
		pointsEarned = 1;
		teamEarned = makerTeam;
	}

	// Apply points
	const newScore: [number, number] = [...state.score] as [number, number];
	newScore[teamEarned] += pointsEarned;

	// check for game over (first to 10 or more points wins)
	const gameWon = newScore[0] >= 10 || newScore[1] >= 10;

	return {
		...state,
		score: newScore,
		phase: gameWon ? 'gameover' : 'dealing',
		// Reset hand state for next deal
		tricks: [],
		currentTrickIndex: 0,
		bid: null,
		loner: null,
		kitty: [],
		deck: [],
		// Rotate dealer clockwise unless game is over
		dealerIndex: gameWon ? state.dealerIndex : (state.dealerIndex + 1) % state.players.length,
	};
};

// Returns the winning team once the game is over
export const getWinner = (state: GameState): 0 | 1 | null => {
	if (state.phase !== 'gameover') return null;
	return state.score[0] >= 10 ? 0 : 1;
};
