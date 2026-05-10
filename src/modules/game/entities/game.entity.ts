import { Chess } from 'chess.js';
import type {
  Color,
  GameEndReason,
  GameResult,
  GameSnaphsot,
  GameStatus,
  MoveInput,
  MoveResult,
  PlayerInfo,
} from '../types/game.types';

export class Game {
  private readonly chess: Chess;
  private _status: GameStatus = 'in_progress';
  private _result?: GameResult;
  private _endReason?: GameEndReason;
  private _endedAt?: Date;
  private readonly _appliedMoveIds = new Set<string>();

  private constructor(
    public readonly id: string,
    public readonly white: PlayerInfo,
    public readonly black: PlayerInfo,
    public readonly startedAt: Date
  ) {
    this.chess = new Chess();
  }

  static create(params: { id: string; white: PlayerInfo; black: PlayerInfo }): Game {
    return new Game(params.id, params.white, params.black, new Date());
  }

  hasPlayer(userId: string): boolean {
    return userId === this.white.userId || userId === this.black.userId;
  }

  colorOf(userId: string): Color | null {
    if (userId === this.white.userId) return 'white';
    if (userId === this.black.userId) return 'black';
    return null;
  }

  whoseTurn(): Color {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  isOver(): boolean {
    return this._status !== 'in_progress';
  }

  makeMove(userId: string, move: MoveInput, clientMoveId?: string): MoveResult {
    if (this.isOver()) return { ok: false, reason: 'game_over' };

    // Идемпотентность: повтор того же clientMoveId - возвращаем текущий снапшот.
    if (clientMoveId && this._appliedMoveIds.has(clientMoveId)) {
      return { ok: true, snapshot: this.toSnapshot() };
    }

    const color = this.colorOf(userId);
    if (!color) return { ok: false, reason: 'not_a_player' };
    if (this.whoseTurn() !== color) {
      return { ok: false, reason: 'not_your_turn' };
    }

    let applied;
    try {
      applied = this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
    } catch {
      return { ok: false, reason: 'illegal_move' };
    }
    if (!applied) return { ok: false, reason: 'illegal_move' };

    if (clientMoveId) this._appliedMoveIds.add(clientMoveId);

    this.detectTermination();
    return { ok: true, snapshot: this.toSnapshot() };
  }

  private detectTermination(): void {
    if (this.chess.isCheckmate()) {
      this._status = 'checkmate';
      this._result = this.chess.turn() === 'b' ? '1-0' : '0-1';
      this._endReason = 'checkmate';
      this._endedAt = new Date();
      return;
    }
    if (this.chess.isStalemate()) {
      this._status = 'stalemate';
      this._result = '1/2-1/2';
      this._endReason = 'stalemate';
      this._endedAt = new Date();
      return;
    }
    if (this.chess.isInsufficientMaterial()) {
      this._status = 'draw';
      this._result = '1/2-1/2';
      this._endReason = 'insuffient_material';
      this._endedAt = new Date();
      return;
    }
    if (this.chess.isThreefoldRepetition()) {
      this._status = 'draw';
      this._result = '1/2-1/2';
      this._endReason = 'threefold_repetition';
      this._endedAt = new Date();
      return;
    }
    if (this.chess.isDraw()) {
      this._status = 'draw';
      this._result = '1/2-1/2';
      this._endReason = 'fifty_move_rule';
      this._endedAt = new Date();
    }
  }

  toSnapshot(): GameSnaphsot {
    return {
      id: this.id,
      white: this.white,
      black: this.black,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      moves: this.chess.history(),
      turn: this.whoseTurn(),
      status: this._status,
      result: this._result,
      endReason: this._endReason,
      startedAt: this.startedAt.toISOString(),
      endedAt: this._endedAt?.toISOString(),
    };
  }
}
