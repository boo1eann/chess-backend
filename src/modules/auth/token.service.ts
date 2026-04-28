import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '@/config';
import { AuthError } from '@/shared/errors/AppError';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type AccessPayload = {
  sub: string;
  username: string;
  type: 'access';
};

export type RefreshPayload = {
  sub: string;
  jti: string;
  type: 'refresh';
};

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: RefreshPayload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): RefreshPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshPayload;
    if (decoded.type !== 'refresh') {
      throw new AuthError('AUTH_UNAUTHORIZED', { message: 'Invalid token type' });
    }
    return decoded;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('AUTH_UNAUTHORIZED', { message: 'Invalid or expired refresh token' });
  }
}
