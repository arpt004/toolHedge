import { z } from 'zod';

const key = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'Use lowercase letters, numbers and underscores only');
const categorySlug = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const FILTER_TYPES = ['CHECKBOX', 'SINGLE_SELECT', 'BOOLEAN', 'RANGE'] as const;
export const FILTER_SOURCE_TYPES = ['PRICING_TYPE', 'PLATFORM', 'TAG', 'FEATURE'] as const;

export const createFilterBody = z
  .object({
    key,
    label: z.string().trim().min(1).max(120),
    type: z.enum(FILTER_TYPES),
    sourceType: z.enum(FILTER_SOURCE_TYPES),
    featureId: z.number().int().positive().optional().nullable(),
    options: z.array(z.object({ value: z.string().max(200), label: z.string().max(200) })).max(100).optional().nullable(),
    isEnabled: z.boolean().optional().default(true),
    displayOrder: z.number().int().min(0).max(10000).optional().default(0),
    categorySlugs: z.array(categorySlug).max(50).optional().default([]),
  })
  .strict()
  .refine((body) => body.sourceType !== 'FEATURE' || body.featureId != null, {
    message: 'featureId is required when sourceType is FEATURE',
    path: ['featureId'],
  })
  .refine((body) => body.sourceType === 'FEATURE' || body.featureId == null, {
    message: 'featureId must be omitted unless sourceType is FEATURE',
    path: ['featureId'],
  });
export type CreateFilterBody = z.infer<typeof createFilterBody>;

export const updateFilterBody = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    type: z.enum(FILTER_TYPES).optional(),
    isEnabled: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(10000).optional(),
    options: z.array(z.object({ value: z.string().max(200), label: z.string().max(200) })).max(100).optional().nullable(),
    categorySlugs: z.array(categorySlug).max(50).optional(),
  })
  .strict();
export type UpdateFilterBody = z.infer<typeof updateFilterBody>;

export const reorderFiltersBody = z
  .object({ order: z.array(z.number().int().positive()).min(1).max(200) })
  .strict();

export const filterIdParam = z.object({ id: z.coerce.number().int().positive() }).strict();
