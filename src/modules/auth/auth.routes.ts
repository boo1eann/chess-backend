import type { PostgresClient } from '@/shared/database/PostgresClient';
import { Router } from 'express';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RegisterInputSchema } from './auth.validator';
import { validate } from '@/shared/middlewares/validate.middleware';

export function createAuthRouter(db: PostgresClient): Router {
  const router = Router();
  const authService = new AuthService(db);
  const controller = new AuthController(authService);

  // Apply device info to ALL auth routes
  // router.use(deviceInfoMiddleware);

  router.post('/register', validate(RegisterInputSchema), controller.register);

  return router;
}
