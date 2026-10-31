import { RequestHandler } from 'express';
import { z } from 'zod';
import {
  CategoryHasDependentsError,
  CategoryNotFoundError,
  CategorySlugConflictError,
  adminCategoriesService,
} from './categories.service';
import {
  categoryIdParam,
  createCategoryBody,
  listCategoriesQuery,
  updateCategoryBody,
} from './categories.validation';

function handleKnownErrors(error: unknown, res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) {
  if (error instanceof CategoryNotFoundError) {
    res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: error.message } });
    return;
  }
  if (error instanceof CategorySlugConflictError) {
    res.status(409).json({ error: { code: 'SLUG_CONFLICT', message: error.message } });
    return;
  }
  if (error instanceof CategoryHasDependentsError) {
    res.status(409).json({
      error: {
        code: 'CATEGORY_HAS_DEPENDENTS',
        message: error.message,
        details: { softwareCount: error.softwareCount, filterCount: error.filterCount },
      },
    });
    return;
  }
  next(error);
}

export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    res.json(await adminCategoriesService.list(listCategoriesQuery.parse(req.query)));
  } catch (error) {
    next(error);
  }
};

export const getCategory: RequestHandler = async (req, res, next) => {
  try {
    const { id } = categoryIdParam.parse(req.params);
    res.json(await adminCategoriesService.getById(id));
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const created = await adminCategoriesService.create(createCategoryBody.parse(req.body));
    res.status(201).json(created);
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
  try {
    const { id } = categoryIdParam.parse(req.params);
    const updated = await adminCategoriesService.update(id, updateCategoryBody.parse(req.body));
    res.json(updated);
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const deleteCategory: RequestHandler = async (req, res, next) => {
  try {
    const { id } = categoryIdParam.parse(req.params);
    const { force } = z
      .object({ force: z.enum(['true', 'false']).optional().default('false') })
      .parse(req.query);
    await adminCategoriesService.delete(id, force === 'true');
    res.status(204).end();
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};
