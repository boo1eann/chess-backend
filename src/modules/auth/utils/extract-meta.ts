import type { Request } from 'express';
import type { RequestMeta } from '../types/request-meta';

export function extractRequestMeta(req: Request): RequestMeta {
  const body = req.body as { deviceName?: unknown; deviceType?: unknown } | undefined;
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.ip ?? null,
    deviceName:
      typeof body?.deviceName === 'string' && body.deviceName.length > 0
        ? body.deviceName.slice(0, 255)
        : null,
    deviceType:
      typeof body?.deviceType === 'string' && body.deviceType.length > 0
        ? body.deviceType.slice(0, 50)
        : null,
  };
}
