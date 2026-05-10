import type {
  GameClientEvents,
  GameServerEvents,
  MatchmakingClientEvents,
  MatchmakingServerEvents,
} from '@/modules/game/types/game-events';
import type { Server, Socket } from 'socket.io';

export interface ClientToServerEvents extends MatchmakingClientEvents, GameClientEvents {}

export interface ServerToClientEvents extends MatchmakingServerEvents, GameServerEvents {
  error: (payload: { code: string; message: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  username: string;
}

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
