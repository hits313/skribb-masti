import { Room } from './Room';
import { GameSettings, Player } from '../../shared/types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(settings: GameSettings, hostSocketId: string, hostName: string, hostAvatar: string): Room {
    const roomId = this.generateRoomCode();
    const room = new Room(roomId, settings);
    
    room.addPlayer(hostSocketId, hostName, hostAvatar, true);
    
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  getPlayerRoom(socketId: string): { roomId: string, player: Player } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.getPlayerBySocketId(socketId);
      if (player) {
        return { roomId, player };
      }
    }
    return null;
  }

  handleDisconnect(socketId: string): { roomId: string, player: Player } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.getPlayerBySocketId(socketId);
      if (player) {
        room.removePlayer(player.id);
        if (room.isEmpty()) {
          this.rooms.delete(roomId);
        }
        return { roomId, player };
      }
    }
    return null;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}
