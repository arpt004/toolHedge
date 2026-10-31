import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ListReviewsQuery, ListSoftwareQuery } from "./software.validation";
import {
  CategoryRecord,
  FeatureSection,
  ReviewPage,
  SoftwareRecord,
  SoftwareRepository,
} from "./software.types";
import { demoDataAllowed, enrichPricing, RawPlan } from "./pricing";
import { resolveAttrFilterConditions } from "./filter-resolution";

const softwareInclude = {
  categories: true,
  tags: true,
  featureValues: { include: { feature: true } },
  plans: { include: { prices: true } },
  company: true,
  links: true,
  media: { orderBy: { position: "asc" } },
  audiences: { include: { audience: true } },
  capabilities: {
    include: { capability: true, minPlan: { select: { slug: true, name: true } } },
    orderBy: { position: "asc" },
  },
  useCases: {
    include: { suggestedPlan: { select: { slug: true, name: true } } },
    orderBy: { position: "asc" },
  },
  prosCons: { orderBy: { position: "asc" } },
  takeaway: true,
  faqs: { orderBy: { position: "asc" } },
  relationshipsFrom: {
    include: {
      toSoftware: {
        select: { slug: true, name: true, tagline: true, logoUrl: true, pricingType: true },
      },
    },
    orderBy: { position: "asc" },
  },
  ratings: true,
  planRecommendations: {
    include: { recommendedPlan: { select: { slug: true, name: true } } },
  },
} satisfies Prisma.SoftwareInclude;
type SoftwareWithRelations = Prisma.SoftwareGetPayload<{
  include: typeof softwareInclude;
}>;

const reviewOrderBy: Record<
  ListReviewsQuery["sort"],
  Prisma.ReviewOrderByWithRelationInput
> = {
  newest: { reviewDate: "desc" },
  highest: { rating: "desc" },
  lowest: { rating: "asc" },
  helpful: { helpfulVotes: "desc" },
};

// The browse grid never renders full plan pricing (only the detail modal
// does, via getBySlug), so the list query skips that relation — it's an
// extra DB round trip the listing page doesn't need. It does need `ratings`
// for the card's star rating and a few `capabilities` for the card's
// feature-highlight chips — both cheap (a handful of rows per software via
// Prisma's relation-join, not a separate round trip per row). Capabilities
// are capped to 4 here since cards only ever show a short preview.
const listInclude = {
  categories: true,
  tags: true,
  ratings: true,
  capabilities: {
    include: { capability: true, minPlan: { select: { slug: true, name: true } } },
    orderBy: { position: "asc" },
    take: 4,
  },
} satisfies Prisma.SoftwareInclude;
type SoftwareListRelations = Prisma.SoftwareGetPayload<{
  include: typeof listInclude;
}>;

function computeIsTrending(
  trendingStartAt: Date | null,
  trendingEndAt: Date | null,
): boolean {
  if (!trendingStartAt || !trendingEndAt) return false;
  const now = Date.now();
  return trendingStartAt.getTime() <= now && now <= trendingEndAt.getTime();
}

function mapCapabilities(
  capabilities: Array<{
    availabilityStatus: string;
    minPlan: { slug: string; name: string } | null;
    capability: {
      slug: string;
      name: string;
      shortDescription: string;
      detailedDescription: string | null;
      category: string | null;
      benefits: string[];
      docUrl: string | null;
      isVerified: boolean;
    };
  }>,
) {
  return capabilities.map((entry) => ({
    slug: entry.capability.slug,
    name: entry.capability.name,
    shortDescription: entry.capability.shortDescription,
    detailedDescription: entry.capability.detailedDescription,
    category: entry.capability.category,
    benefits: entry.capability.benefits,
    docUrl: entry.capability.docUrl,
    isVerified: entry.capability.isVerified,
    availabilityStatus: entry.availabilityStatus,
    minPlan: entry.minPlan,
  }));
}

function mapRatings(
  ratings: Array<{
    dimension: string;
    score: Prisma.Decimal;
    maxScore: Prisma.Decimal;
    source: string;
    sourceName: string | null;
    reviewCount: number | null;
    calculationMethod: string | null;
    calculatedAt: Date;
  }>,
) {
  return ratings.map((rating) => ({
    dimension: rating.dimension,
    score: Number(rating.score),
    maxScore: Number(rating.maxScore),
    source: rating.source,
    sourceName: rating.sourceName,
    reviewCount: rating.reviewCount,
    calculationMethod: rating.calculationMethod,
    calculatedAt: rating.calculatedAt,
  }));
}

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
    const rawAttrParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      if (key.startsWith("f_") && typeof value === "string") rawAttrParams[key] = value;
    }
    const attrFilters = await resolveAttrFilterConditions(rawAttrParams);
    filters.push(...attrFilters);
    const where: Prisma.SoftwareWhereInput = {
      contentStatus: "PUBLISHED",
      ...(filters.length ? { AND: filters } : {}),
      ...(!demoDataAllowed() ? { isDemo: false } : {}),
    };
    // Promise.all instead of $transaction: these are independent reads for a
    // public listing page, so they run concurrently over separate
    // connections rather than paying for a serialized BEGIN/COMMIT.
    const [records, total, facetRecords] = await Promise.all([
      prisma.software.findMany({
        where,
        orderBy: orderBy[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: listInclude,
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
    // One batched aggregate for all cards on this page instead of one
    // query per card — avoids N+1 while still giving each card a real
    // review average/count.
    const reviewSummaries = await this.batchReviewSummaries(
      records.map((record) => record.id),
    );
    const items: SoftwareRecord[] = records.map((record) =>
      this.mapListRecord(
        record,
        reviewSummaries.get(record.id) ?? { average: null, count: 0 },
      ),
    );
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

  private mapListRecord(
    record: SoftwareListRelations,
    reviewStats: { average: number | null; count: number },
  ): SoftwareRecord {
    const { categories, tags, ratings, capabilities, ...item } = record;
    return {
      ...item,
      categories: categories.map(({ slug, name, icon }) => ({
        slug,
        name,
        icon,
      })),
      tags: tags.map(({ slug, name }) => ({ slug, name })),
      ratings: mapRatings(ratings),
      capabilities: mapCapabilities(capabilities),
      isTrending: computeIsTrending(item.trendingStartAt, item.trendingEndAt),
      reviewSummary: {
        average: reviewStats.average,
        count: reviewStats.count,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    };
  }

  private mapRecord(record: SoftwareWithRelations): SoftwareRecord {
    const {
      categories,
      tags,
      featureValues,
      plans,
      company,
      links,
      media,
      audiences,
      capabilities,
      useCases,
      prosCons,
      takeaway,
      faqs,
      relationshipsFrom,
      ratings,
      planRecommendations,
      ...item
    } = record;
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
      planType: plan.planType,
      limits: plan.limits,
      isAvailable: plan.isAvailable,
      lastVerifiedAt: plan.lastVerifiedAt,
      refundPolicyUrl: plan.refundPolicyUrl,
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
      company: company
        ? {
            slug: company.slug,
            name: company.name,
            websiteUrl: company.websiteUrl,
            headquarters: company.headquarters,
            foundedYear: company.foundedYear,
            companySize: company.companySize,
            description: company.description,
          }
        : null,
      links: links.map(({ type, url, label }) => ({ type, url, label })),
      media: media.map(({ type, url, altText, caption, position }) => ({
        type,
        url,
        altText,
        caption,
        position,
      })),
      audiences: audiences.map(({ audience }) => ({
        slug: audience.slug,
        name: audience.name,
      })),
      capabilities: mapCapabilities(capabilities),
      useCases: useCases.map((useCase) => ({
        slug: useCase.slug,
        name: useCase.name,
        description: useCase.description,
        problem: useCase.problem,
        industry: useCase.industry,
        suggestedPlan: useCase.suggestedPlan,
        difficultyLevel: useCase.difficultyLevel,
        estimatedEffort: useCase.estimatedEffort,
      })),
      prosCons: prosCons.map(
        ({ type, description, category, severity, isEditorial, segment }) => ({
          type,
          description,
          category,
          severity,
          isEditorial,
          segment,
        }),
      ),
      takeaway: takeaway
        ? {
            mainValueProp: takeaway.mainValueProp,
            biggestStrength: takeaway.biggestStrength,
            bestUseCase: takeaway.bestUseCase,
            bestFitAudience: takeaway.bestFitAudience,
            standoutFeature: takeaway.standoutFeature,
            pricingTakeaway: takeaway.pricingTakeaway,
            mainLimitation: takeaway.mainLimitation,
            bestReasonToChoose: takeaway.bestReasonToChoose,
            importantConsideration: takeaway.importantConsideration,
          }
        : null,
      faqs: faqs.map(({ question, answer }) => ({ question, answer })),
      relationships: relationshipsFrom.map(({ type, reason, toSoftware }) => ({
        type,
        reason,
        software: toSoftware,
      })),
      ratings: mapRatings(ratings),
      planRecommendations: planRecommendations.map((rec) => ({
        scenario: rec.scenario,
        recommendedPlan: rec.recommendedPlan,
        reasons: rec.reasons,
        targetProfile: rec.targetProfile,
        confidenceLevel: rec.confidenceLevel,
        lastReviewedAt: rec.lastReviewedAt,
      })),
      isTrending: computeIsTrending(item.trendingStartAt, item.trendingEndAt),
    };
  }

  async getBySlug(slug: string): Promise<SoftwareRecord | null> {
    const where: Prisma.SoftwareWhereInput = {
      slug,
      contentStatus: "PUBLISHED",
      ...(!demoDataAllowed() ? { isDemo: false } : {}),
    };
    const [record, reviewStats] = await Promise.all([
      prisma.software.findFirst({ where, include: softwareInclude }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { software: { slug }, moderationStatus: "PUBLISHED" },
        _count: { rating: true },
      }),
    ]);
    if (!record) return null;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      1 | 2 | 3 | 4 | 5,
      number
    >;
    let total = 0;
    let weightedSum = 0;
    for (const bucket of reviewStats) {
      const rating = bucket.rating as 1 | 2 | 3 | 4 | 5;
      if (rating in distribution) distribution[rating] = bucket._count.rating;
      total += bucket._count.rating;
      weightedSum += bucket.rating * bucket._count.rating;
    }
    return {
      ...this.mapRecord(record),
      reviewSummary: {
        average: total > 0 ? Math.round((weightedSum / total) * 10) / 10 : null,
        count: total,
        distribution,
      },
    };
  }

  async listReviews(
    slug: string,
    query: ListReviewsQuery,
  ): Promise<ReviewPage> {
    const where: Prisma.ReviewWhereInput = {
      software: { slug },
      moderationStatus: "PUBLISHED",
    };
    const [records, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: reviewOrderBy[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.review.count({ where }),
    ]);
    return {
      items: records.map((review) => ({
        id: review.id,
        displayName: review.displayName,
        rating: review.rating,
        ratingDimensions: review.ratingDimensions,
        title: review.title,
        body: review.body,
        pros: review.pros,
        cons: review.cons,
        useCase: review.useCase,
        userRole: review.userRole,
        companySize: review.companySize,
        verifiedStatus: review.verifiedStatus,
        reviewDate: review.reviewDate,
        helpfulVotes: review.helpfulVotes,
        publisherResponse: review.publisherResponse,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async getBySlugs(slugs: string[]): Promise<SoftwareRecord[]> {
    const records = await prisma.software.findMany({
      where: {
        slug: { in: slugs },
        contentStatus: "PUBLISHED",
        ...(!demoDataAllowed() ? { isDemo: false } : {}),
      },
      include: softwareInclude,
    });
    const reviewSummaries = await this.batchReviewSummaries(
      records.map((record) => record.id),
    );
    return records.map((record) => ({
      ...this.mapRecord(record),
      reviewSummary: reviewSummaries.get(record.id) ?? {
        average: null,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    }));
  }

  // Shared by list() and getBySlugs(): one batched groupBy for however many
  // software ids are in play, instead of one query per record.
  private async batchReviewSummaries(softwareIds: number[]) {
    const summaries = new Map<
      number,
      { average: number | null; count: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> }
    >();
    if (!softwareIds.length) return summaries;
    const stats = await prisma.review.groupBy({
      by: ["softwareId", "rating"],
      where: { softwareId: { in: softwareIds }, moderationStatus: "PUBLISHED" },
      _count: { rating: true },
    });
    const working = new Map<
      number,
      { total: number; weightedSum: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> }
    >();
    for (const bucket of stats) {
      const entry = working.get(bucket.softwareId) ?? {
        total: 0,
        weightedSum: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      entry.total += bucket._count.rating;
      entry.weightedSum += bucket.rating * bucket._count.rating;
      const rating = bucket.rating as 1 | 2 | 3 | 4 | 5;
      if (rating in entry.distribution) entry.distribution[rating] = bucket._count.rating;
      working.set(bucket.softwareId, entry);
    }
    for (const [softwareId, entry] of working) {
      summaries.set(softwareId, {
        average: entry.total > 0 ? Math.round((entry.weightedSum / entry.total) * 10) / 10 : null,
        count: entry.total,
        distribution: entry.distribution,
      });
    }
    return summaries;
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
        contentStatus: "PUBLISHED",
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
