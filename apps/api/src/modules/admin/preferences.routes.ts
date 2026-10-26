import { Router } from 'express';
import { requireAdmin, requireTrustedOrigin } from '../../middleware/auth';
import { getColumnPreferences, resetColumnPreferences, saveColumnPreferences } from './preferences.controller';

export const adminPreferencesRouter = Router();
adminPreferencesRouter.use(requireAdmin);
adminPreferencesRouter.get('/columns/:tableKey', getColumnPreferences);
adminPreferencesRouter.put('/columns/:tableKey', requireTrustedOrigin, saveColumnPreferences);
adminPreferencesRouter.delete('/columns/:tableKey', requireTrustedOrigin, resetColumnPreferences);
