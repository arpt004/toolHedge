import { Response } from 'express';
import { config } from '../config/env';

export function setAdminSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(config.admin.sessionCookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export function clearAdminSessionCookie(res: Response) {
  res.clearCookie(config.admin.sessionCookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
