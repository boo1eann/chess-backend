import type { RequestContext } from './request-context.types';

declare global {
  namespace Express {
    interface Request {
      id: string;
      context: RequestContext;
    }
  }
}

export {};
