import { Router } from 'express';
import { requireAdmin, requireTrustedOrigin } from '../../middleware/auth';
import {
  createFilter,
  deleteFilter,
  getFilter,
  listFeatureOptions,
  listFilters,
  reorderFilters,
  setFilterEnabled,
  updateFilter,
} from './filters.controller';

export const adminFiltersRouter = Router();
adminFiltersRouter.use(requireAdmin);
adminFiltersRouter.get('/', listFilters);
adminFiltersRouter.get('/feature-options', listFeatureOptions);
adminFiltersRouter.post('/reorder', requireTrustedOrigin, reorderFilters);
adminFiltersRouter.get('/:id', getFilter);
adminFiltersRouter.post('/', requireTrustedOrigin, createFilter);
adminFiltersRouter.patch('/:id', requireTrustedOrigin, updateFilter);
adminFiltersRouter.patch('/:id/enabled', requireTrustedOrigin, setFilterEnabled);
adminFiltersRouter.delete('/:id', requireTrustedOrigin, deleteFilter);
