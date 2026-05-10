import type { RealtimePublisher } from '@/modules/realtime/realtime.publisher';
import type { MatchmakingQueue } from '../queue/matchmaking-queue.interface';
import type { GamerService } from './game.service';
import type { Logger } from 'pino';
import type { PlayerInfo } from '../types/game.types';
import { GameModuleError } from '../errors/game.errors';

export class MatchmakingService {
  constructor(
    private readonly queue: MatchmakingQueue,
    private readonly gameService: GamerService,
    private readonly publisher: RealtimePublisher,
    private readonly logger: Logger
  ) {}

  joinQueue(player: PlayerInfo): void {
    if (this.gameService.findActiveGameForUser(player.userId)) {
      throw new GameModuleError('ALREADY_IN_GAME');
    }
    if (this.queue.has(player.userId)) {
      throw new GameModuleError('ALREADY_IN_QUEUE');
    }

    const opponent = this.queue.takeNext();
    if (!opponent) {
      this.queue.enqueue({
        userId: player.userId,
        username: player.username,
        enqueuedAt: new Date(),
      });
      this.logger.info({ userId: player.userId }, 'queued for matchmaking');
      return;
    }

    // мертвый код? мы же проверили this.queue.has(player.userId)
    if (opponent.userId === player.userId) {
      this.queue.enqueue(opponent);
      return;
    }

    const opponentInfo: PlayerInfo = {
      userId: opponent.userId,
      username: opponent.username,
    };

    const opponentIsWhite = Math.random() < 0.5;
    const white = opponentIsWhite ? opponentInfo : player;
    const black = opponentIsWhite ? player : opponentInfo;

    const game = this.gameService.createGame({ white, black });

    this.publisher.emitToUser(white.userId, 'match:found', {
      gameId: game.id,
      color: 'white',
      opponent: black,
    });
    this.publisher.emitToUser(black.userId, 'match:found', {
      gameId: game.id,
      color: 'black',
      opponent: white,
    });

    this.logger.info({ gameId: game.id, white: white.userId, black: black.userId }, 'match found');
  }

  leaveQueue(userId: string): boolean {
    return this.queue.remove(userId);
  }
}
