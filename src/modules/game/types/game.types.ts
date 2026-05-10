export type Color = 'white' | 'black';

export type GameStatus = 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';

export type GameResult = '1-0' | '0-1' | '1/2-1/2';

export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'insuffient_material'
  | 'threefold_repetition'
  | 'fifty_move_rule'
  | 'white_resigned'
  | 'black_resigned'
  | 'white_disconnected'
  | 'black_disconnected';

export interface PlayerInfo {
  userId: string;
  username: string;
}

export interface MoveInput {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface GameSnaphsot {
  id: string;
  white: PlayerInfo;
  black: PlayerInfo;
  fen: string;
  pgn: string;
  moves: string[];
  turn: Color;
  status: GameStatus;
  result?: GameResult;
  endReason?: GameEndReason;
  startedAt: string;
  endedAt?: string;
}

export type MoveFailureReason =
  | 'not_your_turn'
  | 'illegal_move'
  | 'game_over'
  | 'game_not_found'
  | 'not_a_player';

export type MoveResult =
  | { ok: true; snapshot: GameSnaphsot }
  | { ok: false; reason: MoveFailureReason };
