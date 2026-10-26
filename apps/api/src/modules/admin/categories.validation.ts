import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

export const createCategoryBody = z
  .object({
    slug,
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000),
    icon: z.string().trim().min(1).max(20),
  })
  .strict();
export type CreateCategoryBody = z.infer<typeof createCategoryBody>;

export const updateCategoryBody = createCategoryBody.partial().strict();
export type UpdateCategoryBody = z.infer<typeof updateCategoryBody>;

export const listCategoriesQuery = z
  .object({
    q: z.string().trim().max(100).optional().default(''),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  })
  .strict();
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuery>;

export const categoryIdParam = z.object({ id: z.coerce.number().int().positive() }).strict();
