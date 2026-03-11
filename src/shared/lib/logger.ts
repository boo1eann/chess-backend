import pino, { type LoggerOptions, type Logger } from 'pino';
import type { LoggerConfig } from './logger.types';
import { config } from '@/config';
import { getRequestContext } from './async-context';

const DEFAULT_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.secret',
  '*.creditCard',
  '*.ssn',
  '*.accessToken',
  '*.refreshToken',
];

function buildPinoOptions(loggerConfig: LoggerConfig): LoggerOptions {
  const redactPaths = [...DEFAULT_REDACT_PATHS, ...(loggerConfig.redactPaths ?? [])];

  const options: LoggerOptions = {
    level: loggerConfig.level,
    base: {
      service: loggerConfig.serviceName,
      env: config.env,
      pid: process.pid,
      ...loggerConfig.defaultMeta,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: redactPaths,
      censor: '[REDACTED]',
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    // calls before each log
    mixin() {
      const ctx = getRequestContext();
      if (!ctx) return {};
      return {
        requestId: ctx.requestId,
        // ...(ctx.userId && { userId: ctx.userId }),
        // ...(ctx.sessionId && { sessionId: ctx.sessionId }),
      };
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };

  if (loggerConfig.pretty) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid.hostname',
        singleLine: false,
      },
    };
  }

  return options;
}

let rootLogger: Logger | null = null;

export function initLogger(loggerConfig: LoggerConfig): Logger {
  const options = buildPinoOptions(loggerConfig);
  rootLogger = pino(options);

  rootLogger.info(
    {
      config: { level: loggerConfig.level, pretty: loggerConfig.pretty, async: loggerConfig.async },
    },
    `Logger initialized for service "${loggerConfig.serviceName}"`
  );

  return rootLogger;
}

export function getLogger(): Logger {
  if (!rootLogger) {
    throw new Error('Logger not initialized. Call initLogger() before getLogger().'); // use app error instead default
  }
  return rootLogger;
}

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return getLogger().child(bindings);
}
