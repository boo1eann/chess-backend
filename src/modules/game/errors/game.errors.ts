export type GameModuleErrorCode =
  | 'ALREADY_IN_QUEUE'
  | 'ALREADY_IN_GAME'
  | 'GAME_NOT_FOUND'
  | 'NOT_A_PLAYER'
  | 'NOT_YOUR_TURN'
  | 'ILLEGAL_MOVE'
  | 'GAME_OVER'
  | 'INVALID_PAYLOAD';

export class GameModuleError extends Error {
  constructor(
    public readonly code: GameModuleErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'GameModuleError';
  }
}
