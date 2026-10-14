import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { compareSoftware } from '../controller/compare.controller';

export const compareRouter = Router();
compareRouter.use(authMiddleware);
compareRouter.get('/', compareSoftware);