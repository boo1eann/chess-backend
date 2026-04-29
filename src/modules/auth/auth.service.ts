import crypto from 'node:crypto';
import type { PostgresClient } from '@/shared/database/PostgresClient';
import type { LoginInput, RegisterInput } from './auth.validator';
import { UserRepository } from '../user/user.repository';
import { AuthError } from '@/shared/errors/AppError';
import { getRequestContext } from '@/shared/lib/async-context';
import { hashPassword, verifyPassword } from '@/shared/security/password';
import { toPublicUser } from '../user/user.mapper';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type RefreshPayload,
} from './token.service';
import { AuthRepository } from './auth.repository';
import { hashToken, parseTtl } from './token.utils';
import { config } from '@/config';
import { DUMMY_HASH } from '@/shared/auth/dummy-hash';
import type { RequestMeta } from './types/request-meta';
import { parseUserAgent } from '@/shared/auth/parse-user-agent';
import type { Logger } from 'pino';
import { RefreshToken } from './entities/refresh-token.entity';

export class AuthService {
  private readonly userRepo: UserRepository;
  private readonly authRepo: AuthRepository;

  constructor(
    private readonly db: PostgresClient,
    private readonly logger: Logger
  ) {
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

    const accessToken = signAccessToken({ sub: userId, username: input.username, type: 'access' });
    const refreshToken = signRefreshToken({ sub: userId, jti: tokenId, type: 'refresh' });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(config.jwt.refreshExpiresIn));

    const { deviceName, deviceType } = this.resolveDeviceInfo(meta);

    const newToken = RefreshToken.create({
      id: tokenId,
      userId: userId,
      tokenHash: tokenHash,
      familyId,
      deviceName,
      deviceType,
      userAgent: meta.userAgent,
      ipAddress: meta.ip,
      expiresAt,
    });

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

      await this.authRepo.insert(newToken, tx);

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

    const accessToken = signAccessToken({ sub: user.id, username: user.username, type: 'access' });
    const refreshToken = signRefreshToken({ sub: user.id, jti: tokenId, type: 'refresh' });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(config.jwt.refreshExpiresIn));

    const { deviceName, deviceType } = this.resolveDeviceInfo(meta);

    // Атомарно: апдейт юзера + INSERT refresh_token
    user.recordLogin(meta.ip ?? '');

    const newToken = RefreshToken.create({
      id: tokenId,
      userId: user.id,
      tokenHash: tokenHash,
      familyId,
      deviceName,
      deviceType,
      userAgent: meta.userAgent,
      ipAddress: meta.ip,
      expiresAt,
    });

    await this.db.transaction(async (tx) => {
      await this.userRepo.save(user, tx);
      await this.authRepo.insert(newToken, tx);
    });

    return {
      user: toPublicUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    let payload: RefreshPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err instanceof Error) throw new AuthError('AUTH_UNAUTHORIZED', { cause: err });

      throw err;
    }

    const record = await this.authRepo.findById(payload.jti);

    if (!record) {
      throw new AuthError('AUTH_UNAUTHORIZED', { message: 'Refresh token not recognized' });
    }

    if (record.tokenHash !== hashToken(refreshToken)) {
      throw new AuthError('AUTH_UNAUTHORIZED', { message: 'Refresh token mismatch' });
    }

    if (record.hasBeenReplaced()) {
      this.logger.warn(
        { userId: record.userId, familyId: record.familyId, jti: record.id },
        'Refresh token reuse detected - revoking entire family'
      );
      await this.authRepo.revokeFamily(record.familyId, record.userId, 'reuse_detected');
      throw new AuthError('AUTH_UNAUTHORIZED');
    }

    if (record.isRevoked) {
      throw new AuthError('AUTH_UNAUTHORIZED');
    }

    if (record.isExpired()) {
      throw new AuthError('AUTH_UNAUTHORIZED');
    }

    const user = await this.userRepo.findById(record.userId);
    if (!user) {
      throw new AuthError('AUTH_UNAUTHORIZED', { message: 'User no longer exists' });
    }

    if (user.isBanned || !user.isActive) {
      await this.authRepo.revokeFamily(
        record.familyId,
        record.userId,
        user.isBanned ? 'banned' : 'inactive'
      );
    }

    const newTokenId = crypto.randomUUID();
    const newAccessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      type: 'access',
    });
    const newRefreshToken = signRefreshToken({ sub: user.id, jti: newTokenId, type: 'refresh' });
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(config.jwt.refreshExpiresIn));

    const newToken = RefreshToken.create({
      id: newTokenId,
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: record.familyId,
      deviceName: record.deviceName,
      deviceType: record.deviceType,
      userAgent: record.userAgent,
      ipAddress: meta.ip,
      expiresAt,
    });

    await this.db.transaction(async (tx) => {
      await this.authRepo.insert(newToken, tx);
      record.markReplaceBy(newTokenId);
      await this.authRepo.save(record, tx);
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(rawToken: string | null): Promise<void> {
    if (!rawToken) return;

    try {
      const payload = verifyRefreshToken(rawToken);
      const record = await this.authRepo.findById(payload.jti);
      if (!record) return;

      if (record.userId !== payload.sub) return;
      if (record.tokenHash !== hashToken(rawToken)) return;

      if (record.isRevoked) return;

      const revokedCount = await this.authRepo.revokeFamily(
        record.familyId,
        record.userId,
        'logout'
      );

      this.logger.info(
        { userId: record.userId, familyId: record.familyId, revokedCount },
        'User logger out'
      );
    } catch (err) {
      this.logger.debug({ err }, 'Logout with invalid token - proceeding silently');
    }
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
