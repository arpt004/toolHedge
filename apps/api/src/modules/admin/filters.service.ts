import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { listPublicFilters, resolveAttrFilterConditions } from '../model/filter-resolution';
import { CreateFilterBody, UpdateFilterBody } from './filters.validation';

export class FilterNotFoundError extends Error {
  constructor() {
    super('Filter not found');
    this.name = 'FilterNotFoundError';
  }
}
export class FilterKeyConflictError extends Error {
  constructor(key: string) {
    super(`A filter with key "${key}" already exists`);
    this.name = 'FilterKeyConflictError';
  }
}
export class InvalidFeatureError extends Error {
  constructor() {
    super('Unknown featureId');
    this.name = 'InvalidFeatureError';
  }
}

const filterInclude = {
  feature: { select: { id: true, slug: true, name: true, type: true } },
  categories: { select: { slug: true, name: true } },
} satisfies Prisma.FilterDefinitionInclude;

async function assertCategoriesExist(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
  if (rows.length !== new Set(slugs).size) {
    throw new Error('Unknown category slug(s) in categorySlugs');
  }
  return rows.map((r) => r.id);
}

export const adminFiltersService = {
  async list() {
    return prisma.filterDefinition.findMany({ include: filterInclude, orderBy: { displayOrder: 'asc' } });
  },

  async getById(id: number) {
    const filter = await prisma.filterDefinition.findUnique({ where: { id }, include: filterInclude });
    if (!filter) throw new FilterNotFoundError();
    return filter;
  },

  async listFeatureOptions() {
    return prisma.feature.findMany({
      select: { id: true, slug: true, name: true, type: true, group: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async create(body: CreateFilterBody) {
    if (body.featureId) {
      const feature = await prisma.feature.findUnique({ where: { id: body.featureId } });
      if (!feature) throw new InvalidFeatureError();
    }
    const categoryIds = await assertCategoriesExist(body.categorySlugs);
    try {
      return await prisma.filterDefinition.create({
        data: {
          key: body.key,
          label: body.label,
          type: body.type,
          sourceType: body.sourceType,
          featureId: body.featureId ?? null,
          options: body.options ?? undefined,
          isEnabled: body.isEnabled,
          displayOrder: body.displayOrder,
          categories: { connect: categoryIds.map((id) => ({ id })) },
        },
        include: filterInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new FilterKeyConflictError(body.key);
      }
      throw error;
    }
  },

  async update(id: number, body: UpdateFilterBody) {
    const data: Prisma.FilterDefinitionUpdateInput = {
      label: body.label,
      type: body.type,
      isEnabled: body.isEnabled,
      displayOrder: body.displayOrder,
      options: body.options === null ? Prisma.JsonNull : body.options,
    };
    if (body.categorySlugs !== undefined) {
      const categoryIds = await assertCategoriesExist(body.categorySlugs);
      data.categories = { set: categoryIds.map((catId) => ({ id: catId })) };
    }
    try {
      return await prisma.filterDefinition.update({ where: { id }, data, include: filterInclude });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new FilterNotFoundError();
      }
      throw error;
    }
  },

  async setEnabled(id: number, isEnabled: boolean) {
    try {
      return await prisma.filterDefinition.update({ where: { id }, data: { isEnabled } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new FilterNotFoundError();
      }
      throw error;
    }
  },

  async delete(id: number) {
    try {
      // Only removes the filter definition and its join-table rows; the
      // underlying Feature and any software attribute values are untouched,
      // so disabling/deleting a filter never deletes product data.
      await prisma.filterDefinition.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new FilterNotFoundError();
      }
      throw error;
    }
  },

  async reorder(order: number[]) {
    await prisma.$transaction(
      order.map((id, index) => prisma.filterDefinition.update({ where: { id }, data: { displayOrder: index } })),
    );
  },

  // Thin re-exports so admin routes can reuse the exact same whitelist
  // logic and live-option resolution the public endpoints use.
  resolveAttrFilterConditions,
  listPublicFilters,
};
