import { Router } from 'express';
import { requireAdmin, requireTrustedOrigin } from '../../middleware/auth';
import {
  archiveProduct,
  createProduct,
  deleteProductPermanently,
  getProduct,
  getProductFormOptions,
  listProducts,
  updateProduct,
} from './products.controller';

export const adminProductsRouter = Router();
adminProductsRouter.use(requireAdmin);
adminProductsRouter.get('/', listProducts);
adminProductsRouter.get('/form-options', getProductFormOptions);
adminProductsRouter.get('/:id', getProduct);
adminProductsRouter.post('/', requireTrustedOrigin, createProduct);
adminProductsRouter.patch('/:id', requireTrustedOrigin, updateProduct);
// Soft delete (archive) is the default, safe destructive action.
adminProductsRouter.delete('/:id', requireTrustedOrigin, archiveProduct);
// Permanent delete requires an explicit ?confirm=true, on top of the
// frontend's own confirmation dialog.
adminProductsRouter.delete('/:id/permanent', requireTrustedOrigin, deleteProductPermanently);
