import { RequestHandler } from 'express';
import { z } from 'zod';
import {
  InvalidReferenceError,
  ProductNotFoundError,
  SlugConflictError,
  StaleUpdateError,
  adminProductsService,
} from './products.service';
import {
  createProductBody,
  listAdminProductsQuery,
  productIdParam,
  updateProductBody,
} from './products.validation';

function handleKnownErrors(error: unknown, res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) {
  if (error instanceof ProductNotFoundError) {
    res.status(404).json({ error: { code: 'PRODUCT_NOT_FOUND', message: error.message } });
    return;
  }
  if (error instanceof SlugConflictError) {
    res.status(409).json({ error: { code: 'SLUG_CONFLICT', message: error.message } });
    return;
  }
  if (error instanceof InvalidReferenceError) {
    res.status(400).json({ error: { code: 'INVALID_REFERENCE', message: error.message } });
    return;
  }
  if (error instanceof StaleUpdateError) {
    res.status(409).json({ error: { code: 'STALE_UPDATE', message: error.message } });
    return;
  }
  next(error);
}

export const listProducts: RequestHandler = async (req, res, next) => {
  try {
    const query = listAdminProductsQuery.parse(req.query);
    res.json(await adminProductsService.list(query));
  } catch (error) {
    next(error);
  }
};

export const getProduct: RequestHandler = async (req, res, next) => {
  try {
    const { id } = productIdParam.parse(req.params);
    res.json(await adminProductsService.getById(id));
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const createProduct: RequestHandler = async (req, res, next) => {
  try {
    const body = createProductBody.parse(req.body);
    const created = await adminProductsService.create(body);
    res.status(201).json(created);
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
  try {
    const { id } = productIdParam.parse(req.params);
    const body = updateProductBody.parse(req.body);
    const updated = await adminProductsService.update(id, body);
    res.json(updated);
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const archiveProduct: RequestHandler = async (req, res, next) => {
  try {
    const { id } = productIdParam.parse(req.params);
    await adminProductsService.archive(id);
    res.status(204).end();
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const deleteProductPermanently: RequestHandler = async (req, res, next) => {
  try {
    const { id } = productIdParam.parse(req.params);
    const { confirm } = z.object({ confirm: z.literal('true') }).parse(req.query);
    void confirm;
    await adminProductsService.permanentlyDelete(id);
    res.status(204).end();
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const getProductFormOptions: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await adminProductsService.listFormOptions());
  } catch (error) {
    next(error);
  }
};
