import { v4 as uuidv4 } from 'uuid';
import { GameSettings, Player, RoomState, GameStatus } from '../../shared/types';
import { GameEngine } from '../game/GameEngine';
import { Server } from 'socket.io';

export class Room {
  public id: string;
  public settings: GameSettings;
  public players: Map<string, Player> = new Map();
  public status: GameStatus = 'LOBBY';
  public hostId: string | null = null;
  public gameEngine: GameEngine | null = null;
  
  public currentRound: number = 0;
  public currentDrawerId: string | null = null;

  constructor(id: string, settings: GameSettings) {
    this.id = id;
    this.settings = settings;
  }

  startGame(io: Server) {
    this.gameEngine = new GameEngine(this, io);
    this.gameEngine.startGame();
  }

  resetGame() {
    this.status = 'LOBBY';
    this.currentRound = 0;
    this.currentDrawerId = null;
    this.gameEngine = null;
    
    for (const player of this.players.values()) {
      player.score = 0;
      player.hasGuessed = false;
    }
  }

  addPlayer(socketId: string, username: string, avatar: string, isHost: boolean = false): Player {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error("Room is full");
    }

    const player: Player = {
      id: uuidv4(),
      socketId,
      username,
      avatar,
      score: 0,
      isHost,
      isConnected: true,
      isDrawing: false,
      hasGuessed: false
    };

    this.players.set(player.id, player);
    
    if (isHost) {
      this.hostId = player.id;
    }

    return player;
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
    // Logic to reassign host if host leaves
    if (this.hostId === playerId) {
      const nextPlayer = this.players.values().next().value;
      if (nextPlayer) {
        nextPlayer.isHost = true;
        this.hostId = nextPlayer.id;
      } else {
        this.hostId = null;
      }
    }
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) return player;
    }
    return undefined;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  getPublicState(): RoomState {
    return {
      id: this.id,
      status: this.status,
      players: Array.from(this.players.values()),
      settings: this.settings,
      currentRound: this.currentRound,
      totalRounds: this.settings.rounds * this.players.size,
      currentDrawerId: this.currentDrawerId,
      timeLeft: this.gameEngine ? this.gameEngine.timeLeft : 0,
      wordBlanks: this.gameEngine ? this.gameEngine.currentWord.split('').map((char, i) => {
        if (char === ' ') return '  '; // Double space for word separation
        if (this.gameEngine!.revealedIndices.has(i)) return char + ' ';
        return '_ ';
      }).join('') : ''
    };
  }
}
