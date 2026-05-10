import type {
  Color,
  GameEndReason,
  GameResult,
  GameSnaphsot,
  MoveInput,
  PlayerInfo,
} from './game.types';

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

// client > server
export interface MatchmakingClientEvents {
  'matchmaking:join': (callback: (ack: Ack<{ status: 'queued' }>) => void) => void;
  'matchmaking:cancel': (callback: (ack: Ack<null>) => void) => void;
}

export interface GameClientEvents {
  'game:join': (
    payload: { gameId: string },
    callback: (ack: Ack<{ snapshot: GameSnaphsot }>) => void
  ) => void;
  'game:move': (
    payload: { gameId: string; move: MoveInput; clientMoveId?: string },
    callback: (ack: Ack<{ snapshot: GameSnaphsot }>) => void
  ) => void;
  'game:resign': (payload: { gameId: string }, callback: (ack: Ack<null>) => void) => void;
}

// server > client
export interface MatchmakingServerEvents {
  'match:found': (payload: { gameId: string; color: Color; opponent: PlayerInfo }) => void;
}

export interface GameServerEvents {
  'game:moveMade': (payload: { snapshot: GameSnaphsot }) => void;
  'game:ended': (payload: { gameId: string; result: GameResult; reason: GameEndReason }) => void;
}
