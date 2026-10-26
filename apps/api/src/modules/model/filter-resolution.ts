import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { demoDataAllowed } from './pricing';

// Shared between the public browse endpoint and the admin filter-management
// module: turns admin-configured FilterDefinition rows into (a) safe Prisma
// where-clauses for the public listing, and (b) resolved option sets drawn
// from live product data for the public filter-list endpoint. Living here
// (rather than under modules/admin) keeps the public software repository
// from depending on the admin module.

export async function resolveAttrFilterConditions(
  rawParams: Record<string, string>,
): Promise<Prisma.SoftwareWhereInput[]> {
  const candidateKeys = new Set<string>();
  for (const rawKey of Object.keys(rawParams)) {
    const match = rawKey.match(/^f_(.+?)(?:_(min|max))?$/);
    if (match) candidateKeys.add(match[1]);
  }
  if (!candidateKeys.size) return [];
  const definitions = await prisma.filterDefinition.findMany({
    where: { key: { in: [...candidateKeys] }, isEnabled: true, sourceType: 'FEATURE' },
    include: { feature: true },
  });
  const conditions: Prisma.SoftwareWhereInput[] = [];
  for (const def of definitions) {
    if (!def.feature) continue;
    const base = `f_${def.key}`;
    if (def.feature.type === 'boolean' && rawParams[base] !== undefined) {
      const wanted = rawParams[base] === 'true';
      conditions.push({ featureValues: { some: { featureId: def.featureId!, valueBool: wanted } } });
    } else if (def.feature.type === 'number' && (rawParams[`${base}_min`] || rawParams[`${base}_max`])) {
      const gte = rawParams[`${base}_min`] ? Number(rawParams[`${base}_min`]) : undefined;
      const lte = rawParams[`${base}_max`] ? Number(rawParams[`${base}_max`]) : undefined;
      if ((gte === undefined || Number.isFinite(gte)) && (lte === undefined || Number.isFinite(lte))) {
        conditions.push({
          featureValues: {
            some: {
              featureId: def.featureId!,
              valueNum: { ...(gte !== undefined ? { gte } : {}), ...(lte !== undefined ? { lte } : {}) },
            },
          },
        });
      }
    } else if (def.feature.type === 'text' && rawParams[base] !== undefined) {
      const values = rawParams[base].split(',').map((v) => v.trim()).filter(Boolean).slice(0, 20);
      if (values.length) {
        conditions.push({ featureValues: { some: { featureId: def.featureId!, valueText: { in: values } } } });
      }
    }
  }
  return conditions;
}

export async function listPublicFilters(categorySlug?: string) {
  const where: Prisma.FilterDefinitionWhereInput = {
    isEnabled: true,
    ...(categorySlug ? { OR: [{ categories: { none: {} } }, { categories: { some: { slug: categorySlug } } }] } : {}),
  };
  const filters = await prisma.filterDefinition.findMany({
    where,
    include: { feature: true },
    orderBy: { displayOrder: 'asc' },
  });
  const softwareWhere: Prisma.SoftwareWhereInput = {
    contentStatus: 'PUBLISHED',
    ...(!demoDataAllowed() ? { isDemo: false } : {}),
    ...(categorySlug ? { categories: { some: { slug: categorySlug } } } : {}),
  };

  return Promise.all(
    filters.map(async (filter) => {
      if (filter.sourceType === 'FEATURE' && filter.feature) {
        const values = await prisma.softwareFeature.findMany({
          where: { featureId: filter.feature.id, software: softwareWhere },
          select: { valueBool: true, valueText: true, valueNum: true },
        });
        if (filter.feature.type === 'boolean') {
          return {
            key: filter.key,
            label: filter.label,
            type: filter.type,
            options: [
              { value: 'true', label: 'Yes', count: values.filter((v) => v.valueBool === true).length },
              { value: 'false', label: 'No', count: values.filter((v) => v.valueBool === false).length },
            ],
          };
        }
        if (filter.feature.type === 'number') {
          const nums = values.map((v) => v.valueNum).filter((n): n is number => n !== null);
          return {
            key: filter.key,
            label: filter.label,
            type: filter.type,
            range: nums.length ? { min: Math.min(...nums), max: Math.max(...nums) } : null,
          };
        }
        const counts = new Map<string, number>();
        for (const v of values) {
          if (v.valueText === null) continue;
          counts.set(v.valueText, (counts.get(v.valueText) ?? 0) + 1);
        }
        return {
          key: filter.key,
          label: filter.label,
          type: filter.type,
          options: [...counts.entries()].map(([value, count]) => ({ value, label: value, count })),
        };
      }
      return {
        key: filter.key,
        label: filter.label,
        type: filter.type,
        options: (filter.options as Array<{ value: string; label: string }> | null) ?? [],
      };
    }),
  );
}
