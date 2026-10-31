import { Router } from 'express';
import { requireAdmin, requireTrustedOrigin } from '../../middleware/auth';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from './categories.controller';

export const adminCategoriesRouter = Router();
adminCategoriesRouter.use(requireAdmin);
adminCategoriesRouter.get('/', listCategories);
adminCategoriesRouter.get('/:id', getCategory);
adminCategoriesRouter.post('/', requireTrustedOrigin, createCategory);
adminCategoriesRouter.patch('/:id', requireTrustedOrigin, updateCategory);
adminCategoriesRouter.delete('/:id', requireTrustedOrigin, deleteCategory);
