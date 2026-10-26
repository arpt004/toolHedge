import { RequestHandler } from 'express';
import { z } from 'zod';
import {
  FilterKeyConflictError,
  FilterNotFoundError,
  InvalidFeatureError,
  adminFiltersService,
} from './filters.service';
import { createFilterBody, filterIdParam, reorderFiltersBody, updateFilterBody } from './filters.validation';

function handleKnownErrors(error: unknown, res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) {
  if (error instanceof FilterNotFoundError) {
    res.status(404).json({ error: { code: 'FILTER_NOT_FOUND', message: error.message } });
    return;
  }
  if (error instanceof FilterKeyConflictError) {
    res.status(409).json({ error: { code: 'FILTER_KEY_CONFLICT', message: error.message } });
    return;
  }
  if (error instanceof InvalidFeatureError) {
    res.status(400).json({ error: { code: 'INVALID_FEATURE', message: error.message } });
    return;
  }
  next(error);
}

export const listFilters: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await adminFiltersService.list());
  } catch (error) {
    next(error);
  }
};

export const listFeatureOptions: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await adminFiltersService.listFeatureOptions());
  } catch (error) {
    next(error);
  }
};

export const getFilter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = filterIdParam.parse(req.params);
    res.json(await adminFiltersService.getById(id));
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const createFilter: RequestHandler = async (req, res, next) => {
  try {
    const created = await adminFiltersService.create(createFilterBody.parse(req.body));
    res.status(201).json(created);
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const updateFilter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = filterIdParam.parse(req.params);
    const updated = await adminFiltersService.update(id, updateFilterBody.parse(req.body));
    res.json(updated);
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const setFilterEnabled: RequestHandler = async (req, res, next) => {
  try {
    const { id } = filterIdParam.parse(req.params);
    const { isEnabled } = z.object({ isEnabled: z.boolean() }).strict().parse(req.body);
    res.json(await adminFiltersService.setEnabled(id, isEnabled));
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const deleteFilter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = filterIdParam.parse(req.params);
    await adminFiltersService.delete(id);
    res.status(204).end();
  } catch (error) {
    handleKnownErrors(error, res, next);
  }
};

export const reorderFilters: RequestHandler = async (req, res, next) => {
  try {
    const { order } = reorderFiltersBody.parse(req.body);
    await adminFiltersService.reorder(order);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
