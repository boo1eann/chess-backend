import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '@/config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type AccessPayload = {
  sub: string;
  username: string;
};

type RefreshPayload = {
  sub: string;
  jti: string;
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
