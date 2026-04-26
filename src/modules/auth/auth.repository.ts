import type { PostgresClient } from '@/shared/database/PostgresClient';
import type { Queryable } from '@/shared/database/types';
import { AuthError } from '@/shared/errors/AppError';
import { isPgError, PG_ERROR } from '@/shared/errors/postgres';

export class AuthRepository {
  constructor(private readonly db: PostgresClient) {}

  async saveRefreshToken(
    input: {
      id: string;
      userId: string;
      tokenHash: string;
      familyId: string;
      deviceName: string | null;
      deviceType: string | null;
      userAgent: string | null;
      ip: string | null;
      expiresAt: Date;
    },
    executor?: Queryable
  ): Promise<void> {
    const exec = executor ?? this.db;
    try {
      await exec.query(
        `INSERT INTO refresh_tokens 
         (id, user_id, token_hash, family_id, 
          device_name, device_type, user_agent, ip_address, 
          expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          input.id,
          input.userId,
          input.tokenHash,
          input.familyId,
          input.deviceName,
          input.deviceType,
          input.userAgent,
          input.ip,
          input.expiresAt,
        ]
      );
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.FOREIGN_KEY_VIOLATION) {
        throw new AuthError('AUTH_USER_NOT_FOUND', { cause: err });
      }
      throw err;
    }
  }
}
