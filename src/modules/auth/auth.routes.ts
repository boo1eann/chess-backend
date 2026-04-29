import type { PostgresClient } from '@/shared/database/PostgresClient';
import { Router } from 'express';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoginInputSchema, LogoutInputSchema, RegisterInputSchema } from './auth.validator';
import { validate } from '@/shared/middlewares/validate.middleware';
import type { Logger } from 'pino';

export function createAuthRouter(db: PostgresClient, logger: Logger): Router {
  const router = Router();
  const authService = new AuthService(db, logger);
  const controller = new AuthController(authService);

  // Apply device info to ALL auth routes
  // router.use(deviceInfoMiddleware);

  router.post('/register', validate(RegisterInputSchema), controller.register);
  router.post('/login', validate(LoginInputSchema), controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', validate(LogoutInputSchema), controller.logout);

  return router;
}
