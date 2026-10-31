import { z } from 'zod';

export const tableKeyParam = z
  .object({ tableKey: z.string().trim().min(1).max(60).regex(/^[a-z0-9_-]+$/) })
  .strict();

export const saveColumnsBody = z
  .object({ columns: z.array(z.string().trim().min(1).max(60)).min(1).max(50) })
  .strict();
export type SaveColumnsBody = z.infer<typeof saveColumnsBody>;
