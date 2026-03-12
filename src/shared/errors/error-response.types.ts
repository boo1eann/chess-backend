import type { ReqId } from 'pino-http';
import type { ErrorCodeType, ErrorSeverity } from './error-codes.js';

export interface ApiErrorPayload {
  code: ErrorCodeType;
  message: string;
  severity: ErrorSeverity;
  statusCode: number;
  timestamp: string;
  userAction?: string;
  retryable: boolean;
  retryAfterMs?: number;
  requestId: ReqId | string;
  errors?: ValidationFieldError[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface ValidationFieldError {
  field: string;
  message: string;
  code?: string;
  received?: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    [key: string]: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
