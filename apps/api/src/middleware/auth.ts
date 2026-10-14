import { RequestHandler } from 'express';

// Reserved middleware slot for future authentication. Browse endpoints are public today.
export const authMiddleware: RequestHandler = (_req, _res, next) => next();
