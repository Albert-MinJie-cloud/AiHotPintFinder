import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function initSocket(httpServer: any): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Emit a new hot spot notification to all connected clients
 */
export function emitNotification(notification: {
  id: string;
  keyword: string;
  title: string;
  message: string;
  isAuthentic: boolean;
  hotScore: number;
  createdAt: string;
}) {
  if (io) {
    io.emit('notification', notification);
  }
}

/**
 * Emit hot spots update to all connected clients
 */
export function emitHotSpotsUpdate(keyword: string, hotSpots: any[]) {
  if (io) {
    io.emit('hotSpots:update', { keyword, hotSpots });
  }
}

/**
 * Emit keyword status update
 */
export function emitKeywordUpdate(keyword: any) {
  if (io) {
    io.emit('keyword:update', keyword);
  }
}
