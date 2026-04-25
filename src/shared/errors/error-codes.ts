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

  // Auth
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_USERNAME_TAKEN: 'AUTH_USERNAME_TAKEN',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_ACCOUNT_BANNED: 'AUTH_ACCOUNT_BANNED',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
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

  // Auth
  AUTH_EMAIL_TAKEN: {
    statusCode: 409,
    severity: 'low',
    message: 'Email is already registered',
    retryable: false,
  },
  AUTH_USERNAME_TAKEN: {
    statusCode: 409,
    severity: 'low',
    message: 'Username is already taken',
    retryable: false,
  },
  AUTH_INVALID_CREDENTIALS: {
    statusCode: 401,
    severity: 'low',
    message: 'Invalid email or password',
    retryable: false,
    userAction: 'Check your credentials and try again',
  },
  AUTH_EMAIL_NOT_VERIFIED: {
    statusCode: 403,
    severity: 'low',
    message: 'Email is not verified',
    retryable: false,
    userAction: 'Please verify your email address',
  },
  AUTH_ACCOUNT_LOCKED: {
    statusCode: 423,
    severity: 'medium',
    message: 'Account is locked due to too many failed attempts',
    retryable: true,
    userAction: 'Try again later or contact support',
  },
  AUTH_TOKEN_EXPIRED: {
    statusCode: 401,
    severity: 'low',
    message: 'Authentication token has expired',
    retryable: false,
    userAction: 'Please sign in again',
  },
  AUTH_TOKEN_INVALID: {
    statusCode: 401,
    severity: 'low',
    message: 'Authentication token is invalid',
    retryable: false,
  },
  AUTH_UNAUTHORIZED: {
    statusCode: 401,
    severity: 'low',
    message: 'Authentication required',
    retryable: false,
  },
  AUTH_ACCOUNT_BANNED: {
    statusCode: 401,
    severity: 'low',
    message: 'Account banned',
    retryable: false,
  },
  AUTH_ACCOUNT_DISABLED: {
    statusCode: 401,
    severity: 'low',
    message: 'Account disabled',
    retryable: false,
  },
};
