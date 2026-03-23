import http from 'node:http';
import { createApp } from './app';
import { config } from './config';
import { initLogger } from './shared/lib/logger';
import { PostgresClient } from './shared/database/PostgresClient';

const logger = initLogger({
  serviceName: 'my-api',
  level: config.isDev ? 'debug' : 'info',
  pretty: config.isDev,
  defaultMeta: {
    version: process.env.npm_package_version ?? '1.0.0',
  },
  redactPaths: ['*.email'],
});

async function bootstrap(): Promise<void> {
  const db = new PostgresClient(logger);
  await db.connect();

  const app = createApp(logger, db);
  const httpServer = http.createServer(app);

  httpServer.listen(config.port, () => {
    logger.info(`Server ready [${config.env}] http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during bootstrap');
  process.exit(1);
});
