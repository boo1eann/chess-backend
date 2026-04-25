import type { ZodType } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ValidationFieldError } from '../errors/error-response.types';
import { ValidationError } from '../errors/AppError';

type ValidatedData = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

export function validate<T extends ZodType<ValidatedData>>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors: ValidationFieldError[] = result.error.issues.map((iss) => ({
        field: iss.path.slice(1).join('.'),
        message: iss.message,
        code: iss.code,
      }));

      return next(new ValidationError(errors, req.context));
    }

    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query as ParsedQs;
    if (result.data.params) req.params = result.data.params as ParamsDictionary;

    next();
  };
}
