import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { getDashboardStats } from './dashboard.controller';

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAdmin);
adminDashboardRouter.get('/stats', getDashboardStats);
