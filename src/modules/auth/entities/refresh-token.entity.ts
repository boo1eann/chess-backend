export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  device_name: string | null;
  device_type: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  is_revoked: boolean;
  revoked_at: Date | null;
  revoke_reason: string | null;
  replaced_by_id: string | null;
  created_at: Date;
  last_used_at: Date;
}

export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly familyId: string,
    public deviceName: string | null,
    public deviceType: string | null,
    public ipAddress: string | null,
    public userAgent: string | null,
    public readonly expiresAt: Date,
    public isRevoked: boolean,
    public revokedAt: Date | null,
    public revokeReason: string | null,
    public replacedById: string | null,
    public readonly createdAt: Date,
    public lastUsedAt: Date
  ) {}

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isActive(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  hasBeenReplaced(): boolean {
    return this.replacedById !== null;
  }

  revoke(reason: string): void {
    if (this.isRevoked) return;
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokeReason = reason;
  }

  markReplaceBy(newTokenId: string): void {
    this.replacedById = newTokenId;
    this.lastUsedAt = new Date();
  }

  // assertUsable(): void {
  //   if (this.isRevoked) {
  //     throw new AuthError('AUTH_INVALID_REFRESH_TOKEN');
  //   }
  //   if (this.isExpired()) {
  //     throw new AuthError('AUTH_INVALID_REFRESH_TOKEN');
  //   }
  //   if (this.hasBeenReplaced()) {
  //     throw new AuthError('AUTH_TOKEN_REUSE_DETECTED');
  //   }
  // }

  static create(input: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    deviceName: string | null;
    deviceType: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): RefreshToken {
    const now = new Date();
    return new RefreshToken(
      input.id,
      input.userId,
      input.tokenHash,
      input.familyId,
      input.deviceName,
      input.deviceType,
      input.ipAddress,
      input.userAgent,
      input.expiresAt,
      false,
      null,
      null,
      null,
      now,
      now
    );
  }

  static fromDb(row: RefreshTokenRow): RefreshToken {
    return new RefreshToken(
      row.id,
      row.user_id,
      row.token_hash,
      row.family_id,
      row.device_name,
      row.device_type,
      row.ip_address,
      row.user_agent,
      row.expires_at,
      row.is_revoked,
      row.revoked_at,
      row.revoke_reason,
      row.replaced_by_id,
      row.created_at,
      row.last_used_at
    );
  }
}
