import type { PostgresClient } from '@/shared/database/PostgresClient';
import { User } from './domain/user.entity';
import type { CreateUserInput } from './user.types';
import { isUniqueViolation } from '@/shared/errors/postgres';
import { AuthError } from '@/shared/errors/AppError';
import type { Queryable } from '@/shared/database/types';

export class UserRepository {
  constructor(private readonly db: PostgresClient) {}

  // Принимаем НЕ entity, а данные
  async create(data: CreateUserInput & { id?: string }, executor?: Queryable): Promise<User> {
    const exec = executor ?? this.db;
    try {
      const result = await exec.query(
        `INSERT INTO users (id, email, username, password_hash)
					VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4)
					RETURNING *`,
        [data.id ?? null, data.email, data.username, data.passwordHash]
      );

      return User.fromDb(result.rows[0]);
    } catch (err) {
      if (isUniqueViolation(err, 'users_email_key')) {
        throw new AuthError('AUTH_EMAIL_TAKEN', { cause: err });
      }
      if (isUniqueViolation(err, 'users_username_key')) {
        throw new AuthError('AUTH_USERNAME_TAKEN', { cause: err });
      }
      throw err;
    }
  }

  async save(user: User, executor?: Queryable): Promise<void> {
    const exec = executor ?? this.db;
    await exec.query(
      `UPDATE users SET
       email = $2,
       username = $3,
       password_hash = $4,
       is_email_verified = $5,
       is_active = $6,
       is_banned = $7,
       ban_reason = $8,
       google_id = $9,
       failed_login_attemps = $10,
       locked_until = $11,
       password_changed_at = $12,
       last_login_at = $13,
       last_login_ip = $14
     WHERE id = $1`,
      [
        user.id,
        user.email,
        user.username,
        user.getPasswordHash(), // ← нужен геттер, см. ниже
        user.isEmailVerified,
        user.isActive,
        user.isBanned,
        user.banReason,
        user.googleId,
        user.failedLoginAttempts,
        user.lockedUntil,
        user.passwordChangedAt,
        user.lastLoginAt,
        user.lastLoginIp,
      ]
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    const row = result.rows[0];
    return row ? User.fromDb(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db.query<User>('SELECT * FROM users WHERE username = $1', [username]);
    const row = result.rows[0];
    return row ? User.fromDb(row) : null;
  }

  async findByLogin(login: string, executor?: Queryable): Promise<User | null> {
    const exec = executor ?? this.db;
    const result = await exec.query<User>(
      `SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
      [login]
    );
    return result.rows[0] ? User.fromDb(result.rows[0]) : null;
  }
}
