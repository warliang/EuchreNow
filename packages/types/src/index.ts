import type { GameState, GameSettings, Suit, Card } from '@euchrenow/engine';

// player sitting in a room before game starts
export type RoomPlayer = {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
};

// room in the lobby
export type Room = {
  id: string;
  players: RoomPlayer[];
  gameState: GameState | null; // null until game starts
  settings: GameSettings;
};

export type ClientToServerEvents = {
  'lobby:create': (
    data: { playerName: string; settings: GameSettings },
    callback: (response: { success: boolean; roomId?: string; error?: string }) => void,
  ) => void;
  'lobby:join': (
    data: { playerName: string; roomId: string },
    callback: (response: { success: boolean; roomId?: string; error?: string }) => void,
  ) => void;
  'lobby:leave': () => void;
  'lobby:ready': () => void;
  'lobby:start': () => void;
  'game:orderUp': (data: { goAlone: boolean }) => void;
  'game:pass': () => void;
  'game:nameTrump': (data: { suit: Suit; goAlone: boolean }) => void;
  'game:dealerSwap': (data: { card: Card }) => void;
  'game:playCard': (data: { card: Card }) => void;
  'game:nextHand': () => void;
};

export type ServerToClientEvents = {
  'room:updated': (room: Room) => void;
  'game:stateUpdated': (gameState: GameState) => void;
  'game:error': (data: { message: string }) => void;
};
