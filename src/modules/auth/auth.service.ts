import crypto from 'node:crypto';
import type { PostgresClient } from '@/shared/database/PostgresClient';
import type { LoginInput, RegisterInput } from './auth.validator';
import { UserRepository } from '../user/user.repository';
import { AuthError } from '@/shared/errors/AppError';
import { getRequestContext } from '@/shared/lib/async-context';
import { hashPassword, verifyPassword } from '@/shared/security/password';
import { toPublicUser } from '../user/user.mapper';
import { signAccessToken, signRefreshToken } from './token.service';
import { AuthRepository } from './auth.repository';
import { hashToken, parseTtl } from './token.utils';
import { config } from '@/config';
import { DUMMY_HASH } from '@/shared/auth/dummy-hash';
import type { RequestMeta } from './types/request-meta';
import { parseUserAgent } from '@/shared/auth/parse-user-agent';

export class AuthService {
  private readonly userRepo: UserRepository;
  private readonly authRepo: AuthRepository;

  constructor(private readonly db: PostgresClient) {
    this.userRepo = new UserRepository(db);
    this.authRepo = new AuthRepository(db);
  }

  async register(input: RegisterInput, meta: RequestMeta) {
    const ctx = getRequestContext();

    // check duplicates
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findByEmail(input.email),
      this.userRepo.findByUsername(input.username),
    ]);

    if (existingEmail) throw new AuthError('AUTH_EMAIL_TAKEN', { context: ctx });
    if (existingUsername)
      throw new AuthError('AUTH_USERNAME_TAKEN', {
        context: ctx,
      });

    const passwordHash = await hashPassword(input.password);

    const userId = crypto.randomUUID();
    const tokenId = crypto.randomUUID();
    const familyId = crypto.randomUUID();

    const accessToken = signAccessToken({ sub: userId, username: input.username });
    const refreshToken = signRefreshToken({ sub: userId, jti: tokenId });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(config.jwt.refreshExpiresIn));

    const { deviceName, deviceType } = this.resolveDeviceInfo(meta);

    const user = await this.db.transaction(async (tx) => {
      const newUser = await this.userRepo.create(
        {
          id: userId,
          email: input.email,
          username: input.username,
          passwordHash,
        },
        tx
      );

      await this.authRepo.saveRefreshToken(
        {
          id: tokenId,
          userId,
          tokenHash,
          familyId,
          deviceName,
          deviceType,
          userAgent: meta.userAgent,
          ip: meta.ip,
          expiresAt,
        },
        tx
      );

      return newUser;
    });

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(input: LoginInput, meta: RequestMeta) {
    const user = await this.userRepo.findByLogin(input.login);

    if (!user) {
      await verifyPassword(DUMMY_HASH, input.password).catch(() => false);
      throw new AuthError('AUTH_INVALID_CREDENTIALS');
    }

    // Проверяем lock ДО пароля (защита от bruteforce во время блокировки)
    if (user.isLocked()) {
      throw new AuthError('AUTH_ACCOUNT_LOCKED');
    }

    // Проверка пароля
    const ok = await user.verifyPassword(input.password).catch(() => false);
    if (!ok) {
      user.registerFailedLogin();
      await this.userRepo.save(user);

      if (user.isLocked()) {
        throw new AuthError('AUTH_ACCOUNT_LOCKED');
      }
      throw new AuthError('AUTH_INVALID_CREDENTIALS');
    }

    // Статус-чеки ПОСЛЕ пароля (защита от user enumeration)
    if (user.isBanned) {
      throw new AuthError('AUTH_ACCOUNT_BANNED');
    }
    if (!user.isActive) {
      throw new AuthError('AUTH_ACCOUNT_DISABLED');
    }

    // Готовим токены
    const tokenId = crypto.randomUUID();
    const familyId = crypto.randomUUID();

    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id, jti: tokenId });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(config.jwt.refreshExpiresIn));

    const { deviceName, deviceType } = this.resolveDeviceInfo(meta);

    // Атомарно: апдейт юзера + INSERT refresh_token
    user.recordLogin(meta.ip ?? '');

    await this.db.transaction(async (tx) => {
      await this.userRepo.save(user, tx);
      await this.authRepo.saveRefreshToken(
        {
          id: tokenId,
          userId: user.id,
          tokenHash,
          familyId,
          deviceName,
          deviceType,
          userAgent: meta.userAgent,
          ip: meta.ip,
          expiresAt,
        },
        tx
      );
    });

    return {
      user: toPublicUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  private resolveDeviceInfo(meta: RequestMeta): {
    deviceName: string;
    deviceType: string;
  } {
    const parsed = parseUserAgent(meta.userAgent);
    return {
      deviceName: meta.deviceName ?? parsed.deviceName,
      deviceType: meta.deviceType ?? parsed.deviceType,
    };
  }
}
