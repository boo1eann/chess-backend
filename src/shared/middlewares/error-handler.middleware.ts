import type { ErrorRequestHandler } from 'express';
import { serializeErrorToResponse } from '../errors/error-serializer';

export function errorHandler(): ErrorRequestHandler {
  return (err: unknown, req, res, _next) => {
    res.err = err;

    const requestId = req.id ?? 'unknown';
    const response = serializeErrorToResponse(err, requestId);
    res.status(response.error.statusCode).json(response);
  };
}
