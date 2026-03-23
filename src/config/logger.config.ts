import type { LoggerConfig } from '@/shared/lib/logger.types';
import { config } from '.';

export const loggerConfig: LoggerConfig = {
  serviceName: 'my-api',
  level: config.isDev ? 'debug' : 'info',
  pretty: config.isDev,
  defaultMeta: {
    version: process.env.npm_package_version ?? '1.0.0',
  },
  redactPaths: ['*.email'],
};
