import type { GameState, Player } from './types.js';

export const makePlayers = (): Player[] => {
	return [
		{ id: 'player1', name: 'Alice', hand: [], team: 0 },
		{ id: 'player2', name: 'Bob', hand: [], team: 1 },
		{ id: 'player3', name: 'Charlie', hand: [], team: 0 },
		{ id: 'player4', name: 'Diana', hand: [], team: 1 },
	];
};

export const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
	id: 'gameid1',
	phase: 'waiting',
	players: makePlayers(),
	dealerIndex: 0,
	currentTrickIndex: 0,
	tricks: [],
	bid: null,
	score: [0, 0],
	deck: [],
	kitty: [],
	loner: null,
	settings: {
		stickTheDealer: true,
		goingAlone: true,
	},
	...overrides,
});
