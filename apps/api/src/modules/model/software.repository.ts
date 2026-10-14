import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ListSoftwareQuery } from "../software/software.validation";
import {
  CategoryRecord,
  FeatureSection,
  SoftwareRecord,
  SoftwareRepository,
} from "./software-repository";
import { demoDataAllowed, enrichPricing, RawPlan } from "./pricing";

const softwareInclude = {
  categories: true,
  tags: true,
  featureValues: { include: { feature: true } },
  plans: { include: { prices: true } },
} satisfies Prisma.SoftwareInclude;
type SoftwareWithRelations = Prisma.SoftwareGetPayload<{
  include: typeof softwareInclude;
}>;

const orderBy: Record<
  ListSoftwareQuery["sort"],
  Prisma.SoftwareOrderByWithRelationInput
> = {
  name_asc: { name: "asc" },
  name_desc: { name: "desc" },
  newest: { createdAt: "desc" },
  popular: { popularity: "desc" },
};

export class PrismaSoftwareRepository implements SoftwareRepository {
  async list(query: ListSoftwareQuery) {
    const filters: Prisma.SoftwareWhereInput[] = [];
    if (query.q)
      filters.push({
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { tagline: { contains: query.q, mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
        ],
      });
    if (query.category.length)
      filters.push({ categories: { some: { slug: { in: query.category } } } });
    if (query.pricing.length)
      filters.push({ pricingType: { in: query.pricing } });
    if (query.platform.length)
      filters.push({ platforms: { hasSome: query.platform } });
    if (query.tag.length)
      filters.push({ tags: { some: { slug: { in: query.tag } } } });
    const where: Prisma.SoftwareWhereInput = {
      ...(filters.length ? { AND: filters } : {}),
      ...(!demoDataAllowed() ? { isDemo: false } : {}),
    };
    const [records, total, facetRecords] = await prisma.$transaction([
      prisma.software.findMany({
        where,
        orderBy: orderBy[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: softwareInclude,
      }),
      prisma.software.count({ where }),
      prisma.software.findMany({
        where,
        select: {
          pricingType: true,
          platforms: true,
          categories: { select: { slug: true, name: true } },
          tags: { select: { slug: true, name: true } },
        },
      }),
    ]);
    const categoryCounts = new Map<
      string,
      { slug: string; name: string; count: number }
    >();
    const pricingCounts = new Map<string, number>();
    const platformCounts = new Map<string, number>();
    const tagCounts = new Map<
      string,
      { slug: string; name: string; count: number }
    >();
    for (const record of facetRecords) {
      pricingCounts.set(
        record.pricingType,
        (pricingCounts.get(record.pricingType) ?? 0) + 1,
      );
      for (const platform of record.platforms)
        platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
      for (const category of record.categories) {
        const facet = categoryCounts.get(category.slug) ?? {
          ...category,
          count: 0,
        };
        facet.count += 1;
        categoryCounts.set(category.slug, facet);
      }
      for (const tag of record.tags) {
        const facet = tagCounts.get(tag.slug) ?? { ...tag, count: 0 };
        facet.count += 1;
        tagCounts.set(tag.slug, facet);
      }
    }
    const items: SoftwareRecord[] = records.map((record) => {
      const { plans, ...item } = this.mapRecord(record);
      return {
        ...item,
        pricingSummary: enrichPricing(plans ?? []).pricingSummary,
      };
    });
    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      facets: {
        categories: [...categoryCounts.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        pricing: [...pricingCounts].map(([value, count]) => ({
          value: value as SoftwareRecord["pricingType"],
          count,
        })),
        platforms: [...platformCounts]
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value)),
        tags: [...tagCounts.values()].sort(
          (a, b) => b.count - a.count || a.name.localeCompare(b.name),
        ),
      },
    };
  }

  private mapRecord(record: SoftwareWithRelations): SoftwareRecord {
    const { categories, tags, featureValues, plans, ...item } = record;
    const features = Object.fromEntries(
      featureValues.map((value) => [
        value.feature.slug,
        value.valueBool ?? value.valueText ?? value.valueNum ?? null,
      ]),
    );
    const rawPlans: RawPlan[] = plans.map((plan) => ({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      isFree: plan.isFree,
      isRecommended: plan.isRecommended,
      trialDays: plan.trialDays,
      pricingModel: plan.pricingModel,
      seatsNote: plan.seatsNote,
      highlights: plan.highlights,
      position: plan.position,
      prices: plan.prices.map((price) => ({
        billing: price.billing,
        interval:
          price.intervalUnit && price.intervalCount !== null
            ? { unit: price.intervalUnit, count: price.intervalCount }
            : null,
        amount: price.amount === null ? null : Number(price.amount),
        currency: price.currency,
        note: price.note,
      })),
    }));
    return {
      ...item,
      categories: categories.map(({ slug, name, icon }) => ({
        slug,
        name,
        icon,
      })),
      tags: tags.map(({ slug, name }) => ({ slug, name })),
      features,
      ...enrichPricing(rawPlans),
    };
  }

  async getBySlug(slug: string): Promise<SoftwareRecord | null> {
    const record = await prisma.software.findFirst({
      where: { slug, ...(!demoDataAllowed() ? { isDemo: false } : {}) },
      include: softwareInclude,
    });
    return record ? this.mapRecord(record) : null;
  }

  async getBySlugs(slugs: string[]): Promise<SoftwareRecord[]> {
    const records = await prisma.software.findMany({
      where: {
        slug: { in: slugs },
        ...(!demoDataAllowed() ? { isDemo: false } : {}),
      },
      include: softwareInclude,
    });
    return records.map((record) => this.mapRecord(record));
  }

  async suggest(q: string) {
    if (!q.trim()) return [];
    return prisma.software.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tagline: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { slug: { contains: q.toLowerCase() } },
        ],
        ...(!demoDataAllowed() ? { isDemo: false } : {}),
      },
      select: { slug: true, name: true, logoUrl: true },
      orderBy: { popularity: "desc" },
      take: 8,
    });
  }

  async listFeatureSections(): Promise<FeatureSection[]> {
    const groups = await prisma.featureGroup.findMany({
      include: { features: { orderBy: { id: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return groups.map((group) => ({
      title: group.name,
      features: group.features.map(({ slug, name, type }) => ({
        slug,
        name,
        type: type as FeatureSection["features"][number]["type"],
      })),
    }));
  }

  async listCategories(): Promise<CategoryRecord[]> {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            software: demoDataAllowed() ? true : { where: { isDemo: false } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return categories.map(({ _count, ...category }) => ({
      ...category,
      softwareCount: _count.software,
    }));
  }

  async getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            software: demoDataAllowed() ? true : { where: { isDemo: false } },
          },
        },
      },
    });
    if (!category) return null;
    const { _count, ...record } = category;
    return { ...record, softwareCount: _count.software };
  }
}
