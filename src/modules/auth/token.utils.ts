import crypto from 'node:crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseTtl(s: string): number {
  const match = /^(\d+)([smhd])$/.exec(s);
  if (!match) throw new Error(`Invalid TTL: ${s}`);
  const n = Number(match[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2] as 's' | 'm' | 'h' | 'd'
  ];
  return n * mult;
}
