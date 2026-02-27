import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from "../rooms/RoomManager";
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  ChatMessage
} from "../../shared/types";

const roomManager = new RoomManager();

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Room creation
    socket.on("room:create", ({ settings, username, avatar }, callback) => {
      try {
        const room = roomManager.createRoom(settings, socket.id, username, avatar);
        socket.join(room.id);
        
        // Return room state to the creator
        callback({
          success: true,
          roomId: room.id,
          roomState: room.getPublicState()
        });
        
        console.log(`Room created: ${room.id} by ${username}`);
      } catch (error) {
        console.error("Error creating room:", error);
        callback({ success: false, error: "Failed to create room" });
      }
    });

    // Join room
    socket.on("room:join", ({ code, username, avatar }, callback) => {
      try {
        const room = roomManager.getRoom(code);
        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        const player = room.addPlayer(socket.id, username, avatar);
        socket.join(room.id);

        // Notify others
        socket.to(room.id).emit("room:playerJoined", player);

        // Return success to joiner
        callback({
          success: true,
          roomId: room.id,
          roomState: room.getPublicState()
        });
        
        console.log(`User ${username} joined room ${code}`);
      } catch (error: any) {
        callback({ success: false, error: error.message || "Failed to join room" });
      }
    });

    // Start game
    socket.on("room:start", ({ roomCode }) => {
      const room = roomManager.getRoom(roomCode);
      if (room && room.hostId === socket.id) {
        room.startGame(io);
      }
    });

    // Reset game
    socket.on("room:reset", ({ roomCode }) => {
      const room = roomManager.getRoom(roomCode);
      if (room && room.hostId === socket.id) {
        room.resetGame();
        io.to(room.id).emit("room:settingsUpdated", room.getPublicState());
      }
    });

    // Drawing events
    socket.on("draw:points", (data) => {
      const { roomId } = socket.data || {};
      // We need to know which room the socket is in. 
      // Since we didn't store it in socket.data yet, we can look it up or rely on client sending it.
      // Better: Store roomId in socket.data on join/create.
      
      // For now, let's just broadcast to all rooms the socket is in (except the default one)
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("draw:points", data);
        }
      }
    });

    socket.on("draw:clear", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("draw:clear", {});
        }
      }
    });

    socket.on("draw:end", () => {
       for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("draw:end", {});
        }
      }
    });
    // Chat
    socket.on("chat:send", ({ message }) => {
      const { roomId, player } = roomManager.getPlayerRoom(socket.id) || {};
      if (!roomId || !player) return;

      const chatMessage: ChatMessage = {
        id: uuidv4(),
        playerId: player.id,
        username: player.username,
        avatar: player.avatar,
        text: message,
        timestamp: Date.now(),
        type: 'CHAT'
      };

      const room = roomManager.getRoom(roomId);
      if (room && room.status === 'PLAYING' && room.gameEngine) {
        const isCorrect = room.gameEngine.handleGuess(player.id, message);
        if (isCorrect) {
          chatMessage.type = 'GUESS';
          chatMessage.text = 'Guessed the word!';
        }
      }

      // Here we would check if it's a correct guess
      // For now, just broadcast
      io.to(roomId).emit("chat:message", chatMessage);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      const { roomId, player } = roomManager.handleDisconnect(socket.id) || {};
      
      if (roomId && player) {
        const room = roomManager.getRoom(roomId);
        if (room && room.gameEngine) {
          room.gameEngine.handlePlayerLeave(player.id);
        }
        io.to(roomId).emit("room:playerLeft", player.id);
        // If room is empty/destroyed, logic handles it in manager
      }
    });
    
    // Additional handlers will go here (draw, chat, game)
  });
}
