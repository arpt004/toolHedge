import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env';

// The cookie carries a random opaque token; only its HMAC digest is ever
// persisted, so a database read alone can't be replayed as a valid session
// cookie (the HMAC secret is required too).
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHmac('sha256', config.admin.sessionSecret).update(token).digest('hex');
}

export function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
