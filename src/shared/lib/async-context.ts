import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContext } from '../types/request-context.types';

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function getRequestId(): string {
  return asyncLocalStorage.getStore()?.requestId ?? 'no-request-context';
}
