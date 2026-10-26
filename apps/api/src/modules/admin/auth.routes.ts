import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { attachAdminIfPresent, requireTrustedOrigin } from '../../middleware/auth';
import { login, logout, me } from './auth.controller';

// Brute-force mitigation on the login endpoint specifically: 10 attempts
// per 15 minutes per IP, counting failed attempts only so a legitimate
// admin retrying a typo quickly isn't locked out by their own successes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Try again later.' } },
});

export const adminAuthRouter = Router();
adminAuthRouter.post('/login', requireTrustedOrigin, loginLimiter, login);
adminAuthRouter.post('/logout', requireTrustedOrigin, logout);
adminAuthRouter.get('/me', attachAdminIfPresent, me);
