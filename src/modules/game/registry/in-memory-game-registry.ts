import type { Game } from '../entities/game.entity';
import type { GameRegistry } from './game-registry.interface';

export class InMemoryGameRegistry implements GameRegistry {
  private readonly games = new Map<string, Game>();
  private readonly activeByUser = new Map<string, string>();

  set(game: Game): void {
    this.games.set(game.id, game);
    if (!game.isOver()) {
      this.activeByUser.set(game.white.userId, game.id);
      this.activeByUser.set(game.black.userId, game.id);
    }
  }

  get(gameId: string): Game | null {
    return this.games.get(gameId) ?? null;
  }

  delete(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    this.games.delete(gameId);
    if (this.activeByUser.get(game.white.userId) === gameId) {
      this.activeByUser.delete(game.white.userId);
    }
    if (this.activeByUser.get(game.black.userId) === gameId) {
      this.activeByUser.delete(game.black.userId);
    }
    return true;
  }

  findActiveByUser(userId: string): Game | null {
    const gameId = this.activeByUser.get(userId);
    if (!gameId) return null;
    const game = this.games.get(gameId);
    if (!game || game.isOver()) return null;
    return game;
  }
}
