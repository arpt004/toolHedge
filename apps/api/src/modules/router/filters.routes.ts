import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { listFilters } from '../controller/filters.controller';

export const filtersRouter = Router();
filtersRouter.use(authMiddleware);
filtersRouter.get('/', listFilters);
