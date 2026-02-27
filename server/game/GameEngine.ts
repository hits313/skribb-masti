import { Server } from "socket.io";
import { Room } from "../rooms/Room";
import { WordService } from "./WordService";
import { GameStatus } from "../../shared/types";

export class GameEngine {
  private room: Room;
  private io: Server;
  private wordService: WordService;
  private timer: NodeJS.Timeout | null = null;
  public timeLeft: number = 0;
  public currentWord: string = "";
  public revealedIndices: Set<number> = new Set();

  constructor(room: Room, io: Server) {
    this.room = room;
    this.io = io;
    this.wordService = new WordService();
  }

  startGame() {
    this.room.status = 'PLAYING';
    this.room.currentRound = 1;
    this.startRound();
  }

  private startRound() {
    // Select drawer (round robin)
    this.revealedIndices.clear();
    for (const player of this.room.players.values()) {
      player.hasGuessed = false;
    }

    const playerIndex = (this.room.currentRound - 1) % this.room.players.size;
    const players = Array.from(this.room.players.values());
    const drawer = players[playerIndex];
    
    if (!drawer) {
      this.endGame();
      return;
    }

    this.room.currentDrawerId = drawer.id;
    
    // Select word
    this.currentWord = this.wordService.getRandomWord('easy'); // Simplified for now
    
    // Notify players
    this.io.to(this.room.id).emit("room:settingsUpdated", this.room.getPublicState());
    
    // Send word to drawer
    const drawerSocket = this.io.sockets.sockets.get(drawer.socketId);
    if (drawerSocket) {
      drawerSocket.emit("game:yourTurn", this.currentWord);
    }

    // Start timer
    this.timeLeft = this.room.settings.drawTime;
    this.timer = setInterval(() => {
      this.timeLeft--;
      // Emit timer update
      this.io.to(this.room.id).emit("game:timer", this.timeLeft);
      
      // Reveal hints at 50% and 25% time
      const totalTime = this.room.settings.drawTime;
      if (this.timeLeft === Math.floor(totalTime * 0.5) || this.timeLeft === Math.floor(totalTime * 0.25)) {
        this.revealHint();
      }

      if (this.timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  private revealHint() {
    const wordLength = this.currentWord.length;
    const unrevealed = [];
    for (let i = 0; i < wordLength; i++) {
      if (!this.revealedIndices.has(i) && this.currentWord[i] !== ' ') {
        unrevealed.push(i);
      }
    }
    
    if (unrevealed.length > 0) {
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.revealedIndices.add(randomIndex);
      this.io.to(this.room.id).emit("room:settingsUpdated", this.room.getPublicState());
    }
  }

  private endRound() {
    if (this.timer) clearInterval(this.timer);
    
    this.room.currentRound++;
    const maxRounds = this.room.settings.rounds * this.room.players.size;
    
    if (this.room.currentRound > maxRounds) {
      this.endGame();
    } else {
      this.startRound();
    }
  }

  private endGame() {
    this.room.status = 'GAME_END';
    this.io.to(this.room.id).emit("room:settingsUpdated", this.room.getPublicState());
    if (this.timer) clearInterval(this.timer);
  }
  
  public handleGuess(playerId: string, text: string): boolean {
    // Don't allow drawer to guess
    if (playerId === this.room.currentDrawerId) return false;
    
    // Don't allow already guessed players to guess
    const player = this.room.players.get(playerId);
    if (!player || player.hasGuessed) return false;

    if (text.toLowerCase().trim() === this.currentWord.toLowerCase()) {
      // Correct guess!
      player.hasGuessed = true;
      
      // Calculate score based on time left
      // Max 100 points, min 10 points
      const timeRatio = this.timeLeft / this.room.settings.drawTime;
      const points = Math.max(10, Math.floor(100 * timeRatio));
      player.score += points;

      // Give points to drawer too (e.g., 20 per guess)
      if (this.room.currentDrawerId) {
        const drawer = this.room.players.get(this.room.currentDrawerId);
        if (drawer) {
          drawer.score += 20;
        }
      }

      this.io.to(this.room.id).emit("room:settingsUpdated", this.room.getPublicState());
      this.checkAllGuessed();
      
      return true;
    }
    return false;
  }

  public handlePlayerLeave(playerId: string) {
    if (playerId === this.room.currentDrawerId) {
      // Drawer left, end round immediately
      this.endRound();
    } else {
      // Check if remaining players have all guessed
      this.checkAllGuessed();
    }
  }

  private checkAllGuessed() {
    const players = Array.from(this.room.players.values());
    const guessers = players.filter(p => p.id !== this.room.currentDrawerId);
    const allGuessed = guessers.every(p => p.hasGuessed);
    
    if (allGuessed && guessers.length > 0) {
      this.endRound();
    }
  }
}
