import type { AppServer, ServerToClientEvents } from './types/socket.types';

export class RealtimePublisher {
  constructor(private readonly io: AppServer) {}

  emitToUser<E extends keyof ServerToClientEvents>(
    userId: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ) {
    this.io.to(`user:${userId}`).emit(event, ...args);
  }

  emitToRoom<E extends keyof ServerToClientEvents>(
    room: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void {
    this.io.to(room).emit(event, ...args);
  }
}
