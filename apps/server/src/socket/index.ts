import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, RoomPlayer } from '../types.js';

import {
	createRoom,
	getRoom,
	getRoomByPlayerId,
	addPlayerToRoom,
	removePlayerFromRoom,
	setPlayerReady,
	updateRoomGameState,
	isRoomReady,
} from '../room/roomManager.js';

import {
	createGame,
	startGame,
	startNewHand,
	playerOrderUp,
	playerPassOrderUp,
	playerPassNameTrump,
	playerNameTrump,
	playerDealerSwap,
	playerPlayCard,
	scoreCurrentHand,
} from '@euchrenow/game-engine';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export const registerSocketHandlers = (io: TypedIO) => {
	io.on('connection', (socket: TypedSocket) => {
		console.log(`Client connected: ${socket.id}`);

		// ----- LOBBY -----
		socket.on('lobby:create', (data, callback) => {
			const player: RoomPlayer = {
				id: socket.id, // check where socket id comes from
				name: data.playerName,
				isReady: false,
				isHost: true,
			};

			const room = createRoom(player, data.settings);
			socket.join(room.id);

			callback({ success: true, roomId: room.id });

			io.to(room.id).emit('room:updated', room);
		});

		socket.on('lobby:join', (data, callback) => {
			const room = getRoom(data.roomId);

			if (!room) {
				callback({ success: false, error: 'Room not found' });
				return;
			}

			if (room.players.length >= 4) {
				callback({ success: false, error: 'Room is full' });
				return;
			}

			const player: RoomPlayer = {
				id: socket.id,
				name: data.playerName,
				isReady: false,
				isHost: false,
			};

			const updatedRoom = addPlayerToRoom(data.roomId, player);
			if (!updatedRoom) {
				callback({ success: false, error: 'Failed to join room' });
				return;
			}

			socket.join(data.roomId);
			callback({ success: true, roomId: data.roomId });
			io.to(data.roomId).emit('room:updated', updatedRoom);
		});

		socket.on('lobby:leave', () => {
			const room = getRoomByPlayerId(socket.id);
			if (!room) return;

			socket.leave(room.id);
			const updatedRoom = removePlayerFromRoom(room.id, socket.id);

			if (updatedRoom) {
				io.to(room.id).emit('room:updated', updatedRoom);
			}
		});

		socket.on('lobby:ready', () => {
			const room = getRoomByPlayerId(socket.id);
			if (!room) return;

			const updatedRoom = setPlayerReady(room.id, socket.id);
			if (updatedRoom) {
				io.to(room.id).emit('room:updated', updatedRoom);
			}
		});

		socket.on('lobby:start', () => {
			const room = getRoomByPlayerId(socket.id);
			if (!room) return;

			const player = room.players.find((p) => p.id === socket.id);
			if (!player?.isHost) {
				socket.emit('game:error', { message: 'Only the host can start the game' });
				return;
			}

			if (!isRoomReady(room)) {
				socket.emit('game:error', { message: 'Not all players are ready' });
				return;
			}

			try {
				const gamePlayers = room.players.map((p) => ({ id: p.id, name: p.name }));
				let gameState = createGame(room.id, gamePlayers, room.settings);
				gameState = startGame(gameState);

				updateRoomGameState(room.id, gameState);
				io.to(room.id).emit('game:stateUpdated', gameState);
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		// ----- GAME -----
		socket.on('game:orderUp', (data) => {
			const room = getRoomByPlayerId(socket.id);
			if (!room?.gameState) return;

			try {
				const newState = playerOrderUp(room.gameState, socket.id, data.goAlone);
				updateRoomGameState(room.id, newState);
				io.to(room.id).emit('game:stateUpdated', newState);
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		socket.on('game:pass', () => {
			const room = getRoomByPlayerId(socket.id);
			if (!room?.gameState) return;

			const { gameState } = room;

			try {
				const { phase } = gameState.bid ?? {};
				let newState: ReturnType<typeof playerPassOrderUp>;

				// Determine which pass logic to use based on current phase
				if (phase === 'order-up') {
					newState = playerPassOrderUp(gameState, socket.id);
				} else if (phase === 'name-trump') {
					newState = playerPassNameTrump(gameState, socket.id);
				} else {
					socket.emit('game:error', { message: 'Cannot pass right now' });
					return;
				}

				updateRoomGameState(room.id, newState);
				io.to(room.id).emit('game:stateUpdated', newState);

				// If hand was thrown in, auto-deal next hand
				if (newState.phase === 'dealing') {
					const dealtState = startNewHand(newState);
					updateRoomGameState(room.id, dealtState);
					io.to(room.id).emit('game:stateUpdated', dealtState);
				}
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		socket.on('game:nameTrump', (data) => {
			const room = getRoomByPlayerId(socket.id);
			if (!room?.gameState) return;

			try {
				const newState = playerNameTrump(room.gameState, socket.id, data.suit, data.goAlone);
				updateRoomGameState(room.id, newState);
				io.to(room.id).emit('game:stateUpdated', newState);
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		socket.on('game:dealerSwap', (data) => {
			const room = getRoomByPlayerId(socket.id);
			if (!room?.gameState) return;

			try {
				let newState = playerDealerSwap(room.gameState, socket.id, data.card);

				// Initialize first trick, TODO: move to game engine logic?
				newState = {
					...newState,
					tricks: [{ plays: [], winnerId: null, leadSuit: null }],
					currentTrickIndex: 0,
				};

				updateRoomGameState(room.id, newState);
				io.to(room.id).emit('game:stateUpdated', newState);
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		socket.on('game:playCard', (data) => {
			const room = getRoomByPlayerId(socket.id);
			if (!room?.gameState) return;

			try {
				let newState = playerPlayCard(room.gameState, socket.id, data.card);

				// Auto-score when hand is complete, reduces number of events emitted
				// TODO: consider moving this logic into game engine, like resolvePlayCard
				// resolvePlayCard -> playCard -> checks if complete -> scoreHand -> startNewHand or endGame
				if (newState.phase === 'scoring') {
					newState = scoreCurrentHand(newState);

					// Auto-deal next hand if game isn't over
					if (newState.phase === 'dealing') {
						newState = startNewHand(newState);
					}
				}

				updateRoomGameState(room.id, newState);
				io.to(room.id).emit('game:stateUpdated', newState);
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		// TODO: consider removing this as playCard handler auto-advances
		socket.on('game:nextHand', () => {
			const room = getRoomByPlayerId(socket.id);
			if (!room?.gameState) return;

			try {
				const newState = startNewHand(room.gameState);
				updateRoomGameState(room.id, newState);
				io.to(room.id).emit('game:stateUpdated', newState);
			} catch (err) {
				socket.emit('game:error', { message: (err as Error).message });
			}
		});

		// ----- DISCONNECT -----
		socket.on('disconnect', () => {
			console.log(`disconnected: ${socket.id}`);

			const room = getRoomByPlayerId(socket.id);
			if (!room) return;

			const updatedRoom = removePlayerFromRoom(room.id, socket.id);
			if (updatedRoom) {
				io.to(room.id).emit('room:updated', updatedRoom);
			}
		});
	});
};
