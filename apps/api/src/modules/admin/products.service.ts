import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateProductBody, ListAdminProductsQuery, UpdateProductBody } from './products.validation';

export class SlugConflictError extends Error {
  constructor(slug: string) {
    super(`A product with slug "${slug}" already exists`);
    this.name = 'SlugConflictError';
  }
}
export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found');
    this.name = 'ProductNotFoundError';
  }
}
export class InvalidReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReferenceError';
  }
}
export class StaleUpdateError extends Error {
  constructor() {
    super('This product was changed by someone else since you loaded it. Reload and try again.');
    this.name = 'StaleUpdateError';
  }
}

const adminListInclude = {
  categories: { select: { slug: true, name: true } },
  tags: { select: { slug: true, name: true } },
  _count: { select: { reviews: true } },
} satisfies Prisma.SoftwareInclude;

const adminDetailInclude = {
  categories: { select: { slug: true, name: true } },
  tags: { select: { slug: true, name: true } },
} satisfies Prisma.SoftwareInclude;

const sortMap: Record<ListAdminProductsQuery['sort'], Prisma.SoftwareOrderByWithRelationInput> = {
  name_asc: { name: 'asc' },
  name_desc: { name: 'desc' },
  newest: { createdAt: 'desc' },
  updated_desc: { updatedAt: 'desc' },
  popular: { popularity: 'desc' },
};

async function resolveCategoryIds(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  if (rows.length !== new Set(slugs).size) {
    const found = new Set(rows.map((row) => row.slug));
    const missing = slugs.filter((s) => !found.has(s));
    throw new InvalidReferenceError(`Unknown category slug(s): ${missing.join(', ')}`);
  }
  return rows.map((row) => row.id);
}

async function resolveOrCreateTagIds(slugs: string[]) {
  if (!slugs.length) return [];
  const existing = await prisma.tag.findMany({ where: { slug: { in: slugs } } });
  const existingSlugs = new Set(existing.map((tag) => tag.slug));
  const toCreate = slugs.filter((s) => !existingSlugs.has(s));
  const created = await Promise.all(
    toCreate.map((tagSlug) =>
      prisma.tag.create({
        data: { slug: tagSlug, name: tagSlug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') },
      }),
    ),
  );
  return [...existing, ...created].map((tag) => tag.id);
}

export const adminProductsService = {
  async list(query: ListAdminProductsQuery) {
    const filters: Prisma.SoftwareWhereInput[] = [];
    if (query.q) {
      filters.push({
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { slug: { contains: query.q.toLowerCase() } },
          { tagline: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }
    if (query.status?.length) filters.push({ contentStatus: { in: query.status } });
    if (query.pricing?.length) filters.push({ pricingType: { in: query.pricing } });
    if (query.category?.length) filters.push({ categories: { some: { slug: { in: query.category } } } });
    const where: Prisma.SoftwareWhereInput = filters.length ? { AND: filters } : {};

    const [items, total, statusCounts] = await Promise.all([
      prisma.software.findMany({
        where,
        orderBy: sortMap[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: adminListInclude,
      }),
      prisma.software.count({ where }),
      prisma.software.groupBy({ by: ['contentStatus'], _count: { _all: true } }),
    ]);
    return {
      items: items.map(({ _count, ...item }) => ({ ...item, reviewCount: _count.reviews })),
      page: query.page,
      limit: query.limit,
      total,
      statusCounts: Object.fromEntries(statusCounts.map((row) => [row.contentStatus, row._count._all])),
    };
  },

  async getById(id: number) {
    const record = await prisma.software.findUnique({ where: { id }, include: adminDetailInclude });
    if (!record) throw new ProductNotFoundError();
    return record;
  },

  async create(body: CreateProductBody) {
    const [categoryIds, tagIds] = await Promise.all([
      resolveCategoryIds(body.categorySlugs),
      resolveOrCreateTagIds(body.tagSlugs),
    ]);
    const { categorySlugs, tagSlugs, ...fields } = body;
    try {
      return await prisma.software.create({
        data: {
          ...fields,
          categories: { connect: categoryIds.map((id) => ({ id })) },
          tags: { connect: tagIds.map((id) => ({ id })) },
        },
        include: adminDetailInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new SlugConflictError(body.slug);
      }
      throw error;
    }
  },

  async update(id: number, body: UpdateProductBody) {
    const existing = await prisma.software.findUnique({ where: { id }, select: { updatedAt: true } });
    if (!existing) throw new ProductNotFoundError();
    if (body.expectedUpdatedAt && new Date(body.expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
      throw new StaleUpdateError();
    }

    const { categorySlugs, tagSlugs, expectedUpdatedAt, ...fields } = body;
    const data: Prisma.SoftwareUpdateInput = { ...fields };
    if (categorySlugs !== undefined) {
      const categoryIds = await resolveCategoryIds(categorySlugs);
      data.categories = { set: categoryIds.map((catId) => ({ id: catId })) };
    }
    if (tagSlugs !== undefined) {
      const tagIds = await resolveOrCreateTagIds(tagSlugs);
      data.tags = { set: tagIds.map((tagId) => ({ id: tagId })) };
    }

    try {
      return await prisma.software.update({ where: { id }, data, include: adminDetailInclude });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new SlugConflictError(String(fields.slug ?? ''));
        if (error.code === 'P2025') throw new ProductNotFoundError();
      }
      throw error;
    }
  },

  async archive(id: number) {
    try {
      return await prisma.software.update({ where: { id }, data: { contentStatus: 'ARCHIVED' } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ProductNotFoundError();
      }
      throw error;
    }
  },

  async permanentlyDelete(id: number) {
    try {
      // Child records (plans, prices, reviews, media, etc.) cascade per the
      // schema's existing onDelete: Cascade relations — those are owned
      // detail rows for this product, not unrelated data.
      await prisma.software.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ProductNotFoundError();
      }
      throw error;
    }
  },

  async listFormOptions() {
    const [categories, tags] = await Promise.all([
      prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.tag.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { categories, tags };
  },
};
