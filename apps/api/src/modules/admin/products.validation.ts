import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slug = z.string().trim().min(1).max(160).regex(slugPattern, 'Use lowercase letters, numbers and hyphens only');
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url()
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));

const commaSeparated = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') return value;
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }, z.array(schema).max(20)) as z.ZodType<z.output<T>[] | undefined>;

export const PRICING_TYPES = ['FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE'] as const;
export const PLATFORMS = ['Web', 'Windows', 'Mac', 'Linux', 'iOS', 'Android'] as const;
export const SOFTWARE_STATUSES = ['ACTIVE', 'BETA', 'DISCONTINUED', 'ACQUIRED'] as const;
export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'NEEDS_REVIEW'] as const;
export const DEPLOYMENT_OPTIONS = ['CLOUD', 'ON_PREMISES', 'SELF_HOSTED', 'HYBRID'] as const;

const productFields = {
  slug,
  name: z.string().trim().min(1).max(200),
  tagline: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(20000),
  longDescription: z.string().trim().max(20000).optional().nullable(),
  overview: z.string().trim().max(20000).optional().nullable(),
  howItWorks: z.string().trim().max(20000).optional().nullable(),
  logoUrl: optionalUrl,
  websiteUrl: optionalUrl,
  affiliateUrl: optionalUrl,
  pricingUrl: optionalUrl,
  pricingType: z.enum(PRICING_TYPES),
  platforms: z.array(z.enum(PLATFORMS)).max(10).default([]),
  status: z.enum(SOFTWARE_STATUSES).default('ACTIVE'),
  contentStatus: z.enum(CONTENT_STATUSES).default('DRAFT'),
  deploymentOptions: z.array(z.enum(DEPLOYMENT_OPTIONS)).max(10).default([]),
  supportedLanguages: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  supportedRegions: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  headquarters: z.string().trim().max(200).optional().nullable(),
  licenseType: z.string().trim().max(120).optional().nullable(),
  isOpenSource: z.boolean().default(false),
  hasFreeTrial: z.boolean().default(false),
  hasFreePlan: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  categorySlugs: z.array(slug).max(10).default([]),
  tagSlugs: z.array(slug).max(30).default([]),
};

export const createProductBody = z.object(productFields).strict();
export type CreateProductBody = z.infer<typeof createProductBody>;

export const updateProductBody = createProductBody.partial().extend({
  // Optimistic concurrency: the client must echo back the updatedAt it
  // last saw; a mismatch means someone else edited this record meanwhile.
  expectedUpdatedAt: z.string().datetime().optional(),
});
export type UpdateProductBody = z.infer<typeof updateProductBody>;

export const listAdminProductsQuery = z
  .object({
    q: z.string().trim().max(100).optional().default(''),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sort: z
      .enum(['name_asc', 'name_desc', 'newest', 'updated_desc', 'popular'])
      .optional()
      .default('updated_desc'),
    status: commaSeparated(z.enum(CONTENT_STATUSES)).optional(),
    pricing: commaSeparated(z.enum(PRICING_TYPES)).optional(),
    category: commaSeparated(slug).optional(),
  })
  .strict();
export type ListAdminProductsQuery = z.infer<typeof listAdminProductsQuery>;

export const productIdParam = z.object({ id: z.coerce.number().int().positive() }).strict();
