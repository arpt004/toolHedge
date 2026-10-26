import { RequestHandler } from 'express';
import { config } from '../../config/env';
import { clearAdminSessionCookie, setAdminSessionCookie } from '../../lib/admin-cookie';
import {
  AccountDisabledError,
  InvalidCredentialsError,
  adminAuthService,
} from './auth.service';
import { loginBody } from './auth.validation';

export const login: RequestHandler = async (req, res, next) => {
  try {
    const body = loginBody.parse(req.body);
    const { token, expiresAt, admin } = await adminAuthService.login(body.email, body.password, {
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    });
    setAdminSessionCookie(res, token, expiresAt);
    res.json({ admin });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: error.message } });
      return;
    }
    if (error instanceof AccountDisabledError) {
      res.status(403).json({ error: { code: 'ACCOUNT_DISABLED', message: error.message } });
      return;
    }
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.[config.admin.sessionCookieName];
    if (token) await adminAuthService.logout(token);
    clearAdminSessionCookie(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = (req, res) => {
  res.json({ admin: req.admin ?? null });
};
