import { verifyAccessToken } from '../auth/token.service';
import type { AppSocket } from './types/socket.types';

interface SocketAuthError extends Error {
  data: { code: string; message: string };
}

function makeAuthError(code: string, message: string): SocketAuthError {
  const err = new Error(message) as SocketAuthError;
  err.data = { code, message };
  return err;
}

export function authenticateSocket(socket: AppSocket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token;

  if (!token || typeof token !== 'string') {
    return next(makeAuthError('AUTH_UNAUTHORIZED', 'Missing access token'));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.userId = payload.sub;
    socket.data.username = payload.username;
    next();
  } catch {
    next(makeAuthError('AUTH_UNAUTHORIZED', 'Missing access token'));
  }
}
