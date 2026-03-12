import type { ReqId } from 'pino-http';
import { ERROR_DEFAULTS, ErrorCode } from './error-codes.js';
import type { ApiErrorResponse } from './error-response.types.js';
import { AppError, ValidationError } from './AppError.js';

const isProd = () => process.env.NODE_ENV === 'production';

export function serializeErrorToResponse(
  error: unknown,
  requestId: ReqId | string
): ApiErrorResponse {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        retryable: error.retryable,
        requestId,
        errors: error.errors,
      },
    };
  }

  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        requestId,
        timestamp: new Date().toISOString(),
        severity: error.severity,
        retryable: error.retryable,
      },
    };

    return response;
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: ErrorCode.SYS_INTERNAL_ERROR,
        message: isProd() ? ERROR_DEFAULTS[ErrorCode.SYS_INTERNAL_ERROR].message : error.message,
        statusCode: ERROR_DEFAULTS[ErrorCode.SYS_INTERNAL_ERROR].statusCode,
        requestId,
        timestamp: new Date().toISOString(),
        ...(isProd() && { stack: error.stack }),
        severity: 'high',
        retryable: true,
      },
    };
  }

  return {
    success: false,
    error: {
      code: ErrorCode.SYS_INTERNAL_ERROR,
      message: ERROR_DEFAULTS[ErrorCode.SYS_INTERNAL_ERROR].message,
      statusCode: ERROR_DEFAULTS[ErrorCode.SYS_INTERNAL_ERROR].statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      severity: ERROR_DEFAULTS[ErrorCode.SYS_INTERNAL_ERROR].severity,
      retryable: false,
    },
  };
}
