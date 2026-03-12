import type { RequestContext } from '../types/request-context.types';
import { ERROR_DEFAULTS, ErrorCode, type ErrorCodeType, type ErrorSeverity } from './error-codes';
import type { ValidationFieldError } from './error-response.types';

export interface AppErrorOptions {
  code: ErrorCodeType;
  message?: string;
  severity?: ErrorSeverity;
  userAction?: string;
  retryAfterMs?: number;
  cause?: Error;
  context?: RequestContext;
}

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly userAction?: string;
  public readonly retryable: boolean;
  public readonly retryAfterMs?: number;
  public readonly isOperational: boolean;
  public readonly context?: RequestContext;

  constructor(options: AppErrorOptions) {
    const defaults = ERROR_DEFAULTS[options.code] ?? ERROR_DEFAULTS[ErrorCode.SYS_UNKNOWN];
    const message = options.message ?? defaults.message;

    super(message, { cause: options.cause });

    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = defaults.statusCode;
    this.severity = options.severity ?? defaults.severity;
    this.userAction = options.userAction ?? defaults.userAction;
    this.retryable = defaults.retryable;
    this.retryAfterMs = options.retryAfterMs;
    this.context = options.context ?? undefined;

    this.isOperational = this.statusCode < 500;

    Error.captureStackTrace(this, AppError);
  }

  toLogEntry(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      message: this.message,
      isOperational: this.isOperational,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? { message: this.cause.message, stack: this.cause.stack }
          : this.cause,
      context: this.context,
    };
  }
}

export class ValidationError extends AppError {
  public readonly errors: ValidationFieldError[];

  constructor(errors: ValidationFieldError[]) {
    super({ code: ErrorCode.VALIDATION_FAILED });
    this.errors = errors;
  }
}
