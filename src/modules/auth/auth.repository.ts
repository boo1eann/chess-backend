import type { PostgresClient } from '@/shared/database/PostgresClient';

export class AuthRepository {
  constructor(private readonly db: PostgresClient) {}

  async saveRefreshToken(input: {
    userId: string;
    jti: string;
    tokenHash: string;
    familyId: string;
    userAgent: string | null;
    ip: string | null;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      family_id,
      user_agent,
      ip_address,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.userId, input.tokenHash, input.familyId, input.userAgent, input.ip, input.expiresAt]
    );
  }
}
