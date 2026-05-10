import crypto from 'node:crypto';
import type { RealtimePublisher } from '@/modules/realtime/realtime.publisher';
import type { GameRegistry } from '../registry/game-registry.interface';
import type { Logger } from 'pino';
import type { MoveInput, MoveResult, PlayerInfo } from '../types/game.types';
import { Game } from '../entities/game.entity';

const ENDED_GAME_TTL_MS = 60_000;

export class GamerService {
  constructor(
    private readonly registry: GameRegistry,
    private readonly publisher: RealtimePublisher,
    private readonly logger: Logger
  ) {}

  createGame(params: { white: PlayerInfo; black: PlayerInfo }): Game {
    const game = Game.create({ id: crypto.randomUUID(), white: params.white, black: params.black });
    this.registry.set(game);
    this.logger.info(
      {
        gameId: game.id,
        white: params.white.userId,
        black: params.black.userId,
      },
      'game created'
    );
    return game;
  }

  getGame(gameId: string): Game | null {
    return this.registry.get(gameId);
  }

  findActiveGameForUser(userId: string): Game | null {
    return this.registry.findActiveByUser(userId);
  }

  applyMove(params: {
    gameId: string;
    userId: string;
    move: MoveInput;
    clientMoveId?: string;
  }): MoveResult {
    const game = this.registry.get(params.gameId);
    if (!game) return { ok: false, reason: 'game_not_found' };

    const result = game.makeMove(params.userId, params.move, params.clientMoveId);
    if (!result.ok) return result;

    this.publisher.emitToRoom(`game:${game.id}`, 'game:moveMade', { snapshot: result.snapshot });

    if (game.isOver()) this.handleGameEnded(game);
    return result;
  }

  resign(params: { gameId: string; userId: string; reason?: 'manual' | 'disconnect' }): MoveResult {
    const game = this.registry.get(params.gameId);
    if (!game) return { ok: false, reason: 'game_not_found' };

    const result = game.resign(params.userId, params.reason);
    if (!result.ok) return result;

    this.publisher.emitToRoom(`game:${game.id}`, 'game:moveMade', {
      snapshot: result.snapshot,
    });
    this.handleGameEnded(game);
    return result;
  }

  private handleGameEnded(game: Game): void {
    const snapshot = game.toSnapshot();

    if (snapshot.result && snapshot.endReason) {
      this.publisher.emitToRoom(`game:${game.id}`, 'game:ended', {
        gameId: game.id,
        result: snapshot.result,
        reason: snapshot.endReason,
      });
    }

    this.logger.info(
      {
        gameId: game.id,
        result: snapshot.result,
        reason: snapshot.endReason,
      },
      'game ended'
    );

    setTimeout(() => {
      this.registry.delete(game.id);
    }, ENDED_GAME_TTL_MS).unref();
  }
}
