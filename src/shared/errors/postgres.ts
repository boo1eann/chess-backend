import { DatabaseError } from 'pg';

export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK_DETECTED: '40P01',
} as const;

export function isPgError(err: unknown): err is DatabaseError {
  return err instanceof DatabaseError;
}

export function isUniqueViolation(err: unknown, constraint?: string): err is DatabaseError {
  if (!isPgError(err) || err.code !== PG_ERROR.UNIQUE_VIOLATION) return false;
  return constraint ? err.constraint === constraint : true;
}
