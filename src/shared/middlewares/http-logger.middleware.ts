import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';
import type { Logger } from 'pino';
import { pinoHttp, type Options } from 'pino-http';
import { AppError } from '../errors/AppError';

const SILENT_PATHS = new Set([
  '/health',
  '/healthz',
  '/ready',
  '/readyz',
  '/metrics',
  '/favicon.ico',
]);

export function httpLoggerMiddleware(logger: Logger) {
  const options: Options = {
    logger,
    genReqId: (req) => req.id ?? 'unknown',
    /* 
			как примерно работает
			const level = options.customLogLevel(req, res, err);
    	logger[level](...)
		*/
    customLogLevel(_req: IncomingMessage, res: ServerResponse, err?: Error | undefined) {
      if (err instanceof AppError && !err.isOperational) return 'fatal';
      if (err || (res.statusCode && res.statusCode >= 500)) return 'error';
      if (res.statusCode && res.statusCode >= 400) return 'warn';
      return 'info';
    },

    customSuccessMessage(req: IncomingMessage, res: ServerResponse, responseTime: number) {
      const method = req.method ?? 'UNKNOWN';
      const expressReq = req as unknown as Request;
      const url = expressReq.originalUrl || req.url || '/';
      return `${method} ${url} ${res.statusCode} - ${Math.round(responseTime)}ms`;
    },

    customErrorMessage(req: IncomingMessage, res: ServerResponse, err: Error) {
      const method = req.method ?? 'UNKNOWN';
      const expressReq = req as unknown as Request;
      const url = expressReq.originalUrl || req.url || '/';
      if (err instanceof AppError) {
        return `[${err.code}] ${method} ${url} ${res.statusCode} - ${err.message}`;
      }
      return `${method} ${url} ${res.statusCode} - ${err.message}`;
    },

    customProps(req: IncomingMessage) {
      return {
        requestId: req.id,
      };
    },

    autoLogging: {
      ignore(req: IncomingMessage) {
        return SILENT_PATHS.has(req.url ?? '');
      },
    },

    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          query: req.query,
          ...(process.env.LOG_HEADERS === 'true' && { headers: req.headers }),
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
      // кастомный serializer для err — вызывает toLogEntry() если AppError
      err(err) {
        if (err instanceof AppError) {
          return err.toLogEntry();
        }
        if (err instanceof Error) {
          return {
            name: err.name,
            message: err.message,
            stack: err.stack,
            cause:
              err.cause instanceof Error
                ? { message: err.cause.message, stack: err.cause.stack }
                : err.cause,
          };
        }
        return { thrownValue: err };
      },
    },

    customAttributeKeys: {
      req: 'req',
      res: 'res',
      err: 'err',
      responseTime: 'responseTime',
    },
  };

  return pinoHttp(options);
}
