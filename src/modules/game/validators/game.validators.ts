import z from 'zod';

export const moveInputSchema = z.object({
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
});

export const gameJoinSchema = z.object({
  gameId: z.uuid(),
});

export const gameMoveSchema = z.object({
  gameId: z.uuid(),
  move: moveInputSchema,
  clientMoveId: z.uuid().optional(),
});

export const gameResignSchema = z.object({
  gameId: z.uuid(),
});
