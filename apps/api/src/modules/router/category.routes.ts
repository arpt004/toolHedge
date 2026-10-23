import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getCategory, listCategories } from '../controller/category.controller';

export const categoryRouter = Router();
categoryRouter.use(authMiddleware);
categoryRouter.get('/', listCategories);
categoryRouter.get('/:slug', getCategory);