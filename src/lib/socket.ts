import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

// In development, the server is on the same port (3000) because of the proxy
// In production, it's also the same origin
const SOCKET_URL = '/'; 

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
});
