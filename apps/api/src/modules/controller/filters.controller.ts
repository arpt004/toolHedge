import { RequestHandler } from 'express';
import { z } from 'zod';
import { listPublicFilters } from '../model/filter-resolution';

export const listFilters: RequestHandler = async (req, res, next) => {
  try {
    const { category } = z
      .object({ category: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional() })
      .strict()
      .parse(req.query);
    res.json(await listPublicFilters(category));
  } catch (error) {
    next(error);
  }
};
