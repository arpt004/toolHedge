import { RequestHandler } from 'express';
import { config } from '../config/env';
import { adminAuthService } from '../modules/admin/auth.service';

// Reserved slot for the public-facing routers (software/categories/compare).
// Those endpoints are intentionally public today; this stays a no-op so
// User/Provider auth can be layered in later without moving routers around.
export const authMiddleware: RequestHandler = (_req, _res, next) => next();

function unauthorized(res: Parameters<RequestHandler>[1]) {
  res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Admin login required' } });
}

// Never trust a role/identity supplied by the client — this always re-reads
// the session from the database (via the hashed cookie token) on every
// request, so a revoked session or disabled account is rejected immediately.
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.[config.admin.sessionCookieName];
    if (!token || typeof token !== 'string') return unauthorized(res);
    const admin = await adminAuthService.getAdminBySessionToken(token);
    if (!admin) return unauthorized(res);
    req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
    next();
  } catch (error) {
    next(error);
  }
};

// Like requireAdmin, but never rejects — used for endpoints (e.g. "who am
// I") that need to report auth state rather than enforce it.
export const attachAdminIfPresent: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[config.admin.sessionCookieName];
    if (token && typeof token === 'string') {
      const admin = await adminAuthService.getAdminBySessionToken(token);
      if (admin) req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Defense-in-depth CSRF mitigation for cookie-authenticated, state-changing
// admin requests: the session cookie is SameSite=Lax (already blocks
// cross-site POST/PUT/DELETE from being sent with credentials by the
// browser), and this adds a server-side check that the request's Origin
// matches the configured frontend origin — a cross-site form post can't
// forge that header.
export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || origin !== config.corsOrigin) {
    res.status(403).json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Request origin not allowed' } });
    return;
  }
  next();
};
