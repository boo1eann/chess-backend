import express, { json, urlencoded, type Application } from 'express';
import { requestContextMiddleware } from './shared/middlewares/request-context.middleware';
import { httpLoggerMiddleware } from './shared/middlewares/http-logger.middleware';
import { errorHandler } from './shared/middlewares/error-handler.middleware';
import type { Logger } from 'pino';
import { AppError } from '@/shared/errors/AppError';
import type { PostgresClient } from './shared/database/PostgresClient';

export function createApp(logger: Logger, db: PostgresClient): Application {
  const app = express();

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestContextMiddleware());
  app.use(httpLoggerMiddleware(logger));

  app.get('/test-error', (req, _res, next) => {
    try {
      throw new AppError({ code: 'VALIDATION_FAILED', context: req.context, userAction: 'test' });
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler());

  return app;
}
