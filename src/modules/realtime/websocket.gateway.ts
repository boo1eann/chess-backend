import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type { Logger } from 'pino';
import { RealtimePublisher } from './realtime.publisher';
import type { AppServer } from './types/socket.types';
import { config } from '@/config';
import { authenticateSocket } from './socket-auth.middleware';

export interface WebSocketGateway {
  io: AppServer;
  publisher: RealtimePublisher;
}

export function createWebSocketGateway(httpServer: HttpServer, logger: Logger): WebSocketGateway {
  const io: AppServer = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    transports: ['websocket', 'polling'],
  });

  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const { userId, username } = socket.data;

    await socket.join(`user:${userId}`);

    logger.info({ socketId: socket.id, userId, username }, 'socket connected');

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, 'socket disconnected');
    });
  });

  const publisher = new RealtimePublisher(io);
  return { io, publisher };
}
