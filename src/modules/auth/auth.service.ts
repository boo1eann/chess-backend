import crypto from 'node:crypto';
import type { PostgresClient } from '@/shared/database/PostgresClient';
import type { RegisterInput } from './auth.validator';
import { UserRepository } from '../user/user.repository';
import { AuthError } from '@/shared/errors/AppError';
import { getRequestContext } from '@/shared/lib/async-context';
import { hashPassword } from '@/shared/security/password';
import { toPublicUser } from '../user/user.mapper';
import { signAccessToken, signRefreshToken } from './token.service';
import { AuthRepository } from './auth.repository';
import { hashToken, parseTtl } from './token.utils';
import { config } from '@/config';

export class AuthService {
  private readonly userRepo: UserRepository;
  private readonly authRepo: AuthRepository;

  constructor(private readonly db: PostgresClient) {
    this.userRepo = new UserRepository(db);
    this.authRepo = new AuthRepository(db);
  }

  async register(input: RegisterInput, meta: { userAgent: string | null; ip: string | null }) {
    const ctx = getRequestContext();

    // check duplicates
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findByEmail(input.email),
      this.userRepo.findByUsername(input.username),
    ]);

    if (existingEmail) {
      throw new AuthError('AUTH_EMAIL_TAKEN', { context: ctx });
    }

    if (existingUsername) {
      throw new AuthError('AUTH_USERNAME_TAKEN', {
        context: ctx,
      });
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.userRepo.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });

    const jti = crypto.randomUUID();
    const familyId = crypto.randomUUID();

    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id, jti });

    await this.authRepo.saveRefreshToken({
      userId: user.id,
      jti,
      tokenHash: hashToken(refreshToken),
      familyId,
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt: new Date(Date.now() + parseTtl(config.jwt.refreshExpiresIn)),
    });

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}
