import { RequestHandler } from 'express';
import { prisma } from '../../lib/prisma';

export const getDashboardStats: RequestHandler = async (_req, res, next) => {
  try {
    const [totalProducts, statusCounts, totalCategories, totalFilters, enabledFilters, recentlyUpdated] =
      await Promise.all([
        prisma.software.count(),
        prisma.software.groupBy({ by: ['contentStatus'], _count: { _all: true } }),
        prisma.category.count(),
        prisma.filterDefinition.count(),
        prisma.filterDefinition.count({ where: { isEnabled: true } }),
        prisma.software.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 8,
          select: { id: true, slug: true, name: true, contentStatus: true, updatedAt: true, logoUrl: true },
        }),
      ]);
    const published = statusCounts.find((row) => row.contentStatus === 'PUBLISHED')?._count._all ?? 0;
    res.json({
      totalProducts,
      activeProducts: published,
      inactiveProducts: totalProducts - published,
      statusCounts: Object.fromEntries(statusCounts.map((row) => [row.contentStatus, row._count._all])),
      totalCategories,
      totalFilters,
      enabledFilters,
      recentlyUpdated,
    });
  } catch (error) {
    next(error);
  }
};
