import type { RequestHandler } from 'express';
import type { RequestContext } from '../types/request-context.types';
import { asyncLocalStorage } from '../lib/async-context';
import { randomUUID } from 'crypto';

const REQUEST_ID_HEADER = 'x-request-id';
const CORRELATION_ID_HEADER = 'x-correlation-id';

export function requestContextMiddleware(): RequestHandler {
  return (req, res, next) => {
    const requestId =
      (req.headers[CORRELATION_ID_HEADER] as string) ??
      (req.headers[REQUEST_ID_HEADER] as string) ??
      randomUUID();

    const context: RequestContext = {
      requestId,
    };

    req.id = requestId;
    req.context = context;

    res.setHeader(REQUEST_ID_HEADER, requestId);

    asyncLocalStorage.run(context, () => {
      next(); // pino-http
    });
  };
}
