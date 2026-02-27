import { create } from 'zustand';
import { RoomState, Player, GameSettings } from '../../shared/types';

interface GameStore {
  isConnected: boolean;
  isInRoom: boolean;
  roomState: RoomState | null;
  currentPlayer: Player | null;
  secretWord: string | null;
  
  setConnected: (connected: boolean) => void;
  setRoomState: (state: RoomState) => void;
  setPlayer: (player: Player) => void;
  setSecretWord: (word: string | null) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isConnected: false,
  isInRoom: false,
  roomState: null,
  currentPlayer: null,
  secretWord: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setRoomState: (state) => set({ roomState: state, isInRoom: true }),
  setPlayer: (player) => set({ currentPlayer: player }),
  setSecretWord: (word) => set({ secretWord: word }),
  
  addPlayer: (player) => set((state) => {
    if (!state.roomState) return state;
    return {
      roomState: {
        ...state.roomState,
        players: [...state.roomState.players, player]
      }
    };
  }),

  removePlayer: (playerId) => set((state) => {
    if (!state.roomState) return state;
    return {
      roomState: {
        ...state.roomState,
        players: state.roomState.players.filter(p => p.id !== playerId)
      }
    };
  }),

  reset: () => set({
    isInRoom: false,
    roomState: null,
    currentPlayer: null
  })
}));
