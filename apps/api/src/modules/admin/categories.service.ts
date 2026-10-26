import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateCategoryBody, ListCategoriesQuery, UpdateCategoryBody } from './categories.validation';

export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found');
    this.name = 'CategoryNotFoundError';
  }
}
export class CategorySlugConflictError extends Error {
  constructor(slug: string) {
    super(`A category with slug "${slug}" already exists`);
    this.name = 'CategorySlugConflictError';
  }
}
export class CategoryHasDependentsError extends Error {
  constructor(readonly softwareCount: number, readonly filterCount: number) {
    super(
      `This category is used by ${softwareCount} product(s)${filterCount ? ` and ${filterCount} filter(s)` : ''}. Pass force=true to remove it anyway (products and filters are kept, just unlinked from this category).`,
    );
    this.name = 'CategoryHasDependentsError';
  }
}

export const adminCategoriesService = {
  async list(query: ListCategoriesQuery) {
    const where: Prisma.CategoryWhereInput = query.q
      ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { slug: { contains: query.q.toLowerCase() } }] }
      : {};
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { _count: { select: { software: true, filters: true } } },
      }),
      prisma.category.count({ where }),
    ]);
    return {
      items: items.map(({ _count, ...item }) => ({
        ...item,
        softwareCount: _count.software,
        filterCount: _count.filters,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  },

  async getById(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new CategoryNotFoundError();
    return category;
  },

  async create(body: CreateCategoryBody) {
    try {
      return await prisma.category.create({ data: body });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CategorySlugConflictError(body.slug);
      }
      throw error;
    }
  },

  async update(id: number, body: UpdateCategoryBody) {
    try {
      return await prisma.category.update({ where: { id }, data: body });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new CategorySlugConflictError(body.slug ?? '');
        if (error.code === 'P2025') throw new CategoryNotFoundError();
      }
      throw error;
    }
  },

  async delete(id: number, force: boolean) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { software: true, filters: true } } },
    });
    if (!category) throw new CategoryNotFoundError();
    if (!force && (category._count.software > 0 || category._count.filters > 0)) {
      throw new CategoryHasDependentsError(category._count.software, category._count.filters);
    }
    // Implicit many-to-many join rows (Software, FilterDefinition) are
    // cleaned up automatically by Prisma; this only removes the category
    // itself, never the products or filters that referenced it.
    await prisma.category.delete({ where: { id } });
  },
};
