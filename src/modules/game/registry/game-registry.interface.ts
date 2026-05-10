import type { Game } from '../entities/game.entity';

export interface GameRegistry {
  set(game: Game): void;
  get(gameId: string): Game | null;
  delete(gameId: string): boolean;
  findActiveByUser(userId: string): Game | null;
}
