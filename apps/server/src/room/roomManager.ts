import type { Room, RoomPlayer } from '../types.js';
import type { GameSettings } from '@euchrenow/game-engine';

// In-memory store of all active rooms
// key = roomId, value = Room
const rooms = new Map<string, Room>(); // TODO: moved to redis in future

const generateRoomId = (): string => {
	// Simple 6 character uppercase room code e.g. "XK92BT"
	return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = (player: RoomPlayer, settings: GameSettings): Room => {
	const id = generateRoomId();

	const room: Room = {
		id,
		players: [{ ...player, isHost: true, isReady: false }],
		gameState: null,
		settings,
	};

	rooms.set(id, room);
	return room;
};

export const getRoom = (roomId: string): Room | undefined => {
	return rooms.get(roomId);
};

// TODO: optimize this by keeping a separate map of playerId -> roomId for O(1) lookups instead of O(n) search through rooms
export const getRoomByPlayerId = (playerId: string): Room | undefined => {
	return [...rooms.values()].find((room) => room.players.some((p) => p.id === playerId));
};

export const addPlayerToRoom = (roomId: string, player: RoomPlayer): Room | null => {
	const room = rooms.get(roomId);
	if (!room) return null;
	if (room.players.length >= 4) return null;

	room.players.push({ ...player, isHost: false, isReady: false });
	return room;
};

export const removePlayerFromRoom = (roomId: string, playerId: string): Room | null => {
	const room = rooms.get(roomId);
	if (!room) return null;

	room.players = room.players.filter((p) => p.id !== playerId);

	// If host left, assign host to next player
	if (room.players.length > 0 && !room.players.some((p) => p.isHost)) {
		room.players[0]!.isHost = true;
	}

	// Clean up empty rooms
	if (room.players.length === 0) {
		rooms.delete(roomId);
		return null;
	}

	return room;
};

export const setPlayerReady = (roomId: string, playerId: string): Room | null => {
	const room = rooms.get(roomId);
	if (!room) return null;

	const player = room.players.find((p) => p.id === playerId);
	if (!player) return null;

	player.isReady = !player.isReady;
	return room;
};

export const updateRoomGameState = (roomId: string, gameState: Room['gameState']): Room | null => {
	const room = rooms.get(roomId);
	if (!room) return null;

	room.gameState = gameState;
	return room;
};

export const isRoomReady = (room: Room): boolean => {
	return room.players.length === 4 && room.players.every((p) => p.isReady);
};
