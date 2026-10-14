import { z } from 'zod';

const commaSeparated = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(value => {
  if (value === undefined) return [];
  if (typeof value !== 'string') return value;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}, z.array(schema).max(20)) as z.ZodType<z.output<T>[]>;

export const listSoftwareQuery = z.object({
  q: z.string().trim().max(100).optional().default(''),
  sort: z.enum(['name_asc', 'name_desc', 'newest', 'popular']).optional().default('popular'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  category: commaSeparated(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).optional().default([]),
  pricing: commaSeparated(z.enum(['FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE'])).optional().default([]),
  platform: commaSeparated(z.enum(['Web', 'Windows', 'Mac', 'Linux', 'iOS', 'Android'])).optional().default([]),
  tag: commaSeparated(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).optional().default([]),
}).strict();
export type ListSoftwareQuery = z.infer<typeof listSoftwareQuery>;
