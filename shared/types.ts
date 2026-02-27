export interface GameSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  hintReveals: number;
  language: string;
  gameMode: 'CLASSIC' | 'ANIMALS' | 'FOOD' | 'POP_CULTURE' | 'HARD' | 'CUSTOM';
  wordChoices: number;
  allowProfanity: boolean;
  privateRoom: boolean;
  customWords?: string[];
}

export interface Player {
  id: string;
  socketId: string;
  username: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
}

export type GameStatus = 'LOBBY' | 'PLAYING' | 'ROUND_END' | 'GAME_END';

export interface RoomState {
  id: string;
  status: GameStatus;
  players: Player[];
  settings: GameSettings;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  timeLeft: number;
  wordBlanks: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
  type: 'CHAT' | 'SYSTEM' | 'GUESS';
}

// Socket.IO Events
export interface ClientToServerEvents {
  "room:create": (data: { settings: GameSettings; username: string; avatar: string }, callback: (res: { success: boolean; roomId?: string; roomState?: RoomState; error?: string }) => void) => void;
  "room:join": (data: { code: string; username: string; avatar: string }, callback: (res: { success: boolean; roomId?: string; roomState?: RoomState; error?: string }) => void) => void;
  "room:start": (data: { roomCode: string }) => void;
  "draw:points": (data: { tool: string; color: string; size: number; points: { x: number; y: number }[] }) => void;
  "draw:clear": (data: {}) => void;
  "draw:end": (data: {}) => void;
  "chat:send": (data: { message: string }) => void;
  "room:reset": (data: { roomCode: string }) => void;
}

export interface ServerToClientEvents {
  "room:playerJoined": (player: Player) => void;
  "room:playerLeft": (playerId: string) => void;
  "room:settingsUpdated": (roomState: RoomState) => void;
  "draw:points": (data: { tool: string; color: string; size: number; points: { x: number; y: number }[] }) => void;
  "draw:clear": (data: {}) => void;
  "draw:end": (data: {}) => void;
  "chat:message": (message: ChatMessage) => void;
  "game:timer": (timeLeft: number) => void;
  "game:yourTurn": (word: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  roomId: string;
}
