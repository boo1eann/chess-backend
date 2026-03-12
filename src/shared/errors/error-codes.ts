export const ErrorCode = {
  // System
  SYS_INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  SYS_SERVICE_UNAVAILABLE: 'SYS_SERVICE_UNAVAILABLE',
  SYS_DATABASE_ERROR: 'SYS_DATABASE_ERROR',
  SYS_TIMEOUT: 'SYS_TIMEOUT',
  SYS_NOT_IMPLEMENTED: 'SYS_NOT_IMPLEMENTED',
  SYS_UNKNOWN: 'SYS_UNKNOWN',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_TYPE: 'VALIDATION_INVALID_TYPE',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export const ERROR_DEFAULTS: Record<
  ErrorCodeType,
  {
    statusCode: number;
    severity: ErrorSeverity;
    message: string;
    retryable: boolean;
    userAction?: string;
  }
> = {
  SYS_INTERNAL_ERROR: {
    statusCode: 500,
    severity: 'high',
    message: 'Internal server error',
    retryable: true,
    userAction: 'Please try again later',
  },
  SYS_SERVICE_UNAVAILABLE: {
    statusCode: 503,
    severity: 'critical',
    message: 'Service temporarily unavailable',
    retryable: true,
    userAction: 'Please try again in a few minutes',
  },
  SYS_DATABASE_ERROR: {
    statusCode: 500,
    severity: 'critical',
    message: 'Database error',
    retryable: true,
  },
  SYS_TIMEOUT: {
    statusCode: 504,
    severity: 'high',
    message: 'Request timeout',
    retryable: true,
  },
  SYS_NOT_IMPLEMENTED: {
    statusCode: 501,
    severity: 'high',
    message: 'Function not implemented',
    retryable: false,
  },
  SYS_UNKNOWN: {
    statusCode: 500,
    severity: 'high',
    message: 'Unknown error',
    retryable: true,
  },

  // Validation
  VALIDATION_FAILED: {
    statusCode: 400,
    severity: 'low',
    message: 'Validation failed',
    retryable: false,
  },
  VALIDATION_MISSING_FIELD: {
    statusCode: 400,
    severity: 'low',
    message: 'Required field missing',
    retryable: false,
  },
  VALIDATION_INVALID_TYPE: {
    statusCode: 400,
    severity: 'low',
    message: 'Invalid data type',
    retryable: false,
  },
};
