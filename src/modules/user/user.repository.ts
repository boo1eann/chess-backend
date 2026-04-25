import type { PostgresClient } from '@/shared/database/PostgresClient';
import { User } from './domain/user.entity';
import type { CreateUserInput } from './user.types';
import { isUniqueViolation } from '@/shared/errors/postgres';
import { AuthError } from '@/shared/errors/AppError';

export class UserRepository {
  constructor(private readonly db: PostgresClient) {}

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

  // Принимаем НЕ entity, а данные
  async create(data: CreateUserInput): Promise<User> {
    try {
      const result = await this.db.query(
        `INSERT INTO users (email, username, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [data.email, data.username, data.passwordHash]
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
}
