import type { PostgresClient } from '@/shared/database/PostgresClient';
import type { Queryable } from '@/shared/database/types';
import { AuthError } from '@/shared/errors/AppError';
import { isPgError, PG_ERROR } from '@/shared/errors/postgres';
import { RefreshToken, type RefreshTokenRow } from './entities/refresh-token.entity';

export class AuthRepository {
  constructor(private readonly db: PostgresClient) {}

  async insert(input: RefreshToken, executor?: Queryable): Promise<void> {
    const exec = executor ?? this.db;
    try {
      await exec.query(
        `INSERT INTO refresh_tokens 
         (id, user_id, token_hash, family_id, 
          device_name, device_type, user_agent, ip_address, 
          expires_at, is_revoked, revoked_at, revoke_reason, replaced_by_id, last_used_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          input.id,
          input.userId,
          input.tokenHash,
          input.familyId,
          input.deviceName,
          input.deviceType,
          input.userAgent,
          input.ipAddress,
          input.expiresAt,
          input.isRevoked,
          input.revokedAt,
          input.revokeReason,
          input.replacedById,
          input.lastUsedAt,
          input.createdAt,
        ]
      );
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.FOREIGN_KEY_VIOLATION) {
        throw new AuthError('AUTH_USER_NOT_FOUND', { cause: err });
      }
      throw err;
    }
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const result = await this.db.query<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? RefreshToken.fromDb(result.rows[0]) : null;
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }

  async revokeFamily(
    familyId: string,
    userId: string,
    reason: string,
    executor?: Queryable
  ): Promise<number> {
    const exec = executor ?? this.db;
    const result = await exec.query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = $3
       WHERE family_id = $1
       AND user_id = $2
       AND is_revoked = FALSE`,
      [familyId, userId, reason]
    );
    return result.rowCount ?? 0;
  }

  async save(token: RefreshToken, executor?: Queryable): Promise<void> {
    const exec = executor ?? this.db;
    await exec.query(
      `UPDATE refresh_tokens SET
       device_name = $2,
       device_type = $3,
       user_agent = $4,
       ip_address = $5,
       is_revoked = $6,
       revoked_at = $7,
       revoke_reason = $8,
       replaced_by_id = $9,
       last_used_at = $10
     WHERE id = $1`,
      [
        token.id,
        token.deviceName,
        token.deviceType,
        token.userAgent,
        token.ipAddress,
        token.isRevoked,
        token.revokedAt,
        token.revokeReason,
        token.replacedById,
        token.lastUsedAt,
      ]
    );
  }
}
