import { verifyPassword } from '@/shared/security/password';

export interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  google_id: string | null;
  failed_login_attemps: number;
  locked_until: Date | null;
  password_changed_at: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  created_at: Date;
  updated_at: Date;
}

export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public username: string,

    private passwordHash: string | null,

    public isEmailVerified: boolean,
    public isActive: boolean,
    public isBanned: boolean,
    public banReason: string | null,

    public googleId: string | null,

    public failedLoginAttempts: number,
    public lockedUntil: Date | null,
    public passwordChangedAt: Date | null,

    public lastLoginAt: Date | null,
    public lastLoginIp: string | null,

    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  isLocked(): boolean {
    return !!this.lockedUntil && this.lockedUntil > new Date();
  }

  registerFailedLogin() {
    this.failedLoginAttempts++;

    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }

  resetLoginAttempts() {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  ban(reason: string) {
    this.isBanned = true;
    this.isActive = false;
    this.banReason = reason;
  }

  unban() {
    this.isBanned = false;
    this.isActive = true;
    this.banReason = null;
  }

  verifyEmail() {
    this.isEmailVerified = true;
  }

  changePassword(newHash: string) {
    this.passwordHash = newHash;
    this.passwordChangedAt = new Date();

    this.resetLoginAttempts();
  }

  recordLogin(ip: string) {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip;

    this.resetLoginAttempts();
  }

  getPasswordHash(): string | null {
    return this.passwordHash;
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return await verifyPassword(this.passwordHash, plainPassword);
  }

  static fromDb(row: UserRow): User {
    return new User(
      row.id,
      row.email,
      row.username,
      row.password_hash,

      row.is_email_verified,
      row.is_active,
      row.is_banned,
      row.ban_reason,

      row.google_id,

      row.failed_login_attemps,
      row.locked_until,
      row.password_changed_at,

      row.last_login_at,
      row.last_login_ip,

      row.created_at,
      row.updated_at
    );
  }
}
