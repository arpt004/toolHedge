import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.ADMIN_SESSION_SECRET) {
  throw new Error('ADMIN_SESSION_SECRET must be set in production');
}

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  isProduction,
  admin: {
    // Used to HMAC session tokens at rest (DB stores only the hash, never
    // the raw cookie value) — dev gets a stable fallback so a fresh clone
    // works out of the box, production must set its own.
    sessionSecret: process.env.ADMIN_SESSION_SECRET ?? 'dev-only-insecure-secret-change-me',
    sessionCookieName: 'th_admin_session',
    sessionTtlHours: Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12),
  },
};
