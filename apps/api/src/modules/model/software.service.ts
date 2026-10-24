import { PrismaSoftwareRepository } from "./software.repository";
import {
  CompareFeatureValue,
  FeatureSection,
  SoftwareRecord,
} from "./software.types";
import { enrichPricing, formatIntervalLabel } from "./pricing";
import { ListReviewsQuery, ListSoftwareQuery } from "./software.validation";

const repository = new PrismaSoftwareRepository();

export class MissingSoftwareError extends Error {
  constructor(readonly slug: string) {
    super(`Software '${slug}' was not found`);
    this.name = "MissingSoftwareError";
  }
}

const isDifferent = (values: CompareFeatureValue[]) => {
  const known = values.filter(
    (value): value is Exclude<CompareFeatureValue, null> => value !== null,
  );
  return (
    known.length > 1 &&
    known.some((value) => JSON.stringify(value) !== JSON.stringify(known[0]))
  );
};

const makeRow = (
  slug: string,
  label: string,
  type: FeatureSection["features"][number]["type"],
  values: CompareFeatureValue[],
) => ({
  slug,
  label,
  type,
  values,
  isDifferent: isDifferent(values),
});

interface Recommendation {
  scenario: string;
  label: string;
  winnerSlugs: string[];
  reason: string;
}

// Transparent, rule-based recommendations — each one is grounded in a
// single, clearly-stated comparison of real stored data, never an
// arbitrary weighted score across ratings/price/features. When the data
// can't support a call, the reason says so explicitly instead of guessing.
function buildRecommendations(
  records: SoftwareRecord[],
  appPricing: ReturnType<typeof enrichPricing>[],
  comparableCurrency: boolean,
): Recommendation[] {
  const nameList = (slugs: string[]) =>
    slugs.map((slug) => records.find((record) => record.slug === slug)!.name).join(" and ");

  const freeIndexes = records
    .map((_, index) => index)
    .filter((index) => appPricing[index].pricingSummary.hasFreePlan);
  const bestFree: Recommendation = {
    scenario: "best_free",
    label: "Best free option",
    winnerSlugs: freeIndexes.map((index) => records[index].slug),
    reason: freeIndexes.length
      ? `${nameList(freeIndexes.map((index) => records[index].slug))} ${freeIndexes.length === 1 ? "offers" : "offer"} a free plan.`
      : "None of the compared tools offer a free plan.",
  };

  const rated = records
    .map((record, index) => ({
      slug: record.slug,
      index,
      average: record.reviewSummary?.average ?? null,
      count: record.reviewSummary?.count ?? 0,
    }))
    .filter((entry) => entry.count > 0 && entry.average !== null);
  const bestRated: Recommendation = rated.length
    ? (() => {
        const best = Math.max(...rated.map((entry) => entry.average!));
        const winners = rated.filter((entry) => entry.average === best).map((entry) => entry.slug);
        return {
          scenario: "best_rated",
          label: "Best rated by users",
          winnerSlugs: winners,
          reason: `${nameList(winners)} ${winners.length === 1 ? "has" : "have"} the highest user rating (${best.toFixed(1)}/5) among the tools in this comparison that have reviews.`,
        };
      })()
    : {
        scenario: "best_rated",
        label: "Best rated by users",
        winnerSlugs: [],
        reason: "None of the compared tools have user reviews yet.",
      };

  let cheapest: Recommendation;
  if (!comparableCurrency) {
    cheapest = {
      scenario: "cheapest_starting_price",
      label: "Cheapest starting price",
      winnerSlugs: [],
      reason:
        "The compared tools price in different currencies, so starting prices can't be ranked directly.",
    };
  } else {
    const priced = records
      .map((record, index) => ({
        slug: record.slug,
        index,
        amount: appPricing[index].pricingSummary.startingPrice?.monthlyEquivalent ?? null,
      }))
      .filter((entry) => entry.amount !== null);
    if (priced.length) {
      const min = Math.min(...priced.map((entry) => entry.amount!));
      const winners = priced.filter((entry) => entry.amount === min).map((entry) => entry.slug);
      cheapest = {
        scenario: "cheapest_starting_price",
        label: "Cheapest starting price",
        winnerSlugs: winners,
        reason: `${nameList(winners)} ${winners.length === 1 ? "has" : "have"} the lowest disclosed starting monthly price in this comparison.`,
      };
    } else {
      cheapest = {
        scenario: "cheapest_starting_price",
        label: "Cheapest starting price",
        winnerSlugs: [],
        reason: "None of the compared tools disclose a starting price.",
      };
    }
  }

  return [bestFree, bestRated, cheapest];
}

export const softwareService = {
  async list(query: ListSoftwareQuery) {
    return repository.list(query);
  },
  async getBySlug(slug: string) {
    return repository.getBySlug(slug);
  },
  async listCategories() {
    return repository.listCategories();
  },
  async getCategoryBySlug(slug: string) {
    return repository.getCategoryBySlug(slug);
  },
  async suggest(q: string) {
    return repository.suggest(q);
  },
  async listReviews(slug: string, query: ListReviewsQuery) {
    return repository.listReviews(slug, query);
  },
  async compare(slugs: string[]) {
    const [records, featureSections] = await Promise.all([
      repository.getBySlugs(slugs),
      repository.listFeatureSections(),
    ]);
    const bySlug = new Map(records.map((record) => [record.slug, record]));
    const missing = slugs.find((slug) => !bySlug.has(slug));
    if (missing) throw new MissingSoftwareError(missing);
    const recordsInRequestOrder = slugs.map((slug) => bySlug.get(slug)!);
    const apps = recordsInRequestOrder.map((record) => ({
      id: record.id,
      slug: record.slug,
      name: record.name,
      tagline: record.tagline,
      description: record.description,
      logoUrl: record.logoUrl,
      pricingType: record.pricingType,
      platforms: record.platforms,
      websiteUrl: record.websiteUrl,
      affiliateUrl: record.affiliateUrl,
      popularity: record.popularity,
      isVerified: record.isVerified ?? false,
      verifiedAt: record.verifiedAt ?? null,
      isTrending: record.isTrending ?? false,
      isOpenSource: record.isOpenSource ?? false,
      status: record.status ?? null,
      launchDate: record.launchDate ?? null,
      lastVerifiedAt: record.lastVerifiedAt ?? null,
      companyName: record.company?.name ?? null,
      category: record.categories[0]?.name ?? null,
      ratings: record.ratings ?? [],
      reviewSummary: record.reviewSummary ?? { average: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      audiences: record.audiences ?? [],
      useCases: record.useCases ?? [],
      prosCons: record.prosCons ?? [],
      deploymentOptions: record.deploymentOptions ?? [],
      supportedLanguages: record.supportedLanguages ?? [],
    }));
    const sections = featureSections.map((section) => ({
      title: section.title,
      rows: section.features.map((feature) =>
        makeRow(
          feature.slug,
          feature.name,
          feature.type,
          recordsInRequestOrder.map(
            (record) => record.features?.[feature.slug] ?? null,
          ),
        ),
      ),
    }));
    const basics = [
      makeRow(
        "pricing-type",
        "Pricing type",
        "text",
        recordsInRequestOrder.map((record) => record.pricingType),
      ),
      makeRow(
        "platforms",
        "Platforms",
        "text",
        recordsInRequestOrder.map((record) => record.platforms.join(", ")),
      ),
    ];
    const appPricing = recordsInRequestOrder.map((record) =>
      enrichPricing(record.plans ?? []),
    );
    const currencies = new Set(
      appPricing.flatMap((pricing) =>
        pricing.plans.flatMap((plan) =>
          plan.prices.map((price) => price.currency),
        ),
      ),
    );
    const pricingValues: CompareFeatureValue[][] = [
      appPricing.map((pricing) => pricing.pricingSummary.hasFreePlan),
      appPricing.map((pricing) =>
        pricing.pricingSummary.hasFreeTrial
          ? pricing.pricingSummary.trialDays
          : null,
      ),
      appPricing.map((pricing) =>
        pricing.pricingSummary.startingPrice
          ? `${pricing.pricingSummary.startingPrice.monthlyEquivalent} ${pricing.pricingSummary.startingPrice.currency}/month`
          : null,
      ),
      appPricing.map(
        (pricing) => pricing.pricingSummary.billingOptions.join(", ") || null,
      ),
      appPricing.map((pricing) => {
        const annual = pricing.plans
          .flatMap((plan) => plan.prices)
          .filter(
            (price) =>
              price.billing === "RECURRING" && price.yearlyEquivalent !== null,
          )
          .sort(
            (left, right) => left.yearlyEquivalent! - right.yearlyEquivalent!,
          )[0];
        return annual
          ? `${annual.yearlyEquivalent} ${annual.currency}/year`
          : null;
      }),
      appPricing.map((pricing) => pricing.pricingSummary.hasOneTimeOrLifetime),
      appPricing.map((pricing) => pricing.pricingSummary.hasCustomPricing),
    ];
    const pricingLabels = [
      ["free-plan", "Free plan", "boolean"],
      ["free-trial", "Free trial (days)", "number"],
      ["starting-price", "Starting price", "text"],
      ["billing-options", "Billing options", "text"],
      ["cheapest-yearly-cost", "Cheapest yearly cost", "text"],
      ["one-time-or-lifetime", "One-time/lifetime option", "boolean"],
      ["custom-pricing", "Custom pricing", "boolean"],
    ] as const;
    const pricingRows = pricingLabels.map(([slug, label, type], index) =>
      makeRow(slug, label, type, pricingValues[index]),
    );

    // Ratings are grouped by dimension *and* source/sourceName, so an
    // editorial score and a user-review average for the same dimension
    // never land in the same row and get compared as if equivalent.
    const ratingRowKey = (dimension: string, source: string, sourceName: string | null) =>
      `${dimension}::${source}::${sourceName ?? ""}`;
    const ratingRows = new Map<
      string,
      { dimension: string; source: string; sourceName: string | null; maxScore: number; values: (number | null)[] }
    >();
    recordsInRequestOrder.forEach((record, appIndex) => {
      for (const rating of record.ratings ?? []) {
        const key = ratingRowKey(rating.dimension, rating.source, rating.sourceName);
        const row =
          ratingRows.get(key) ??
          {
            dimension: rating.dimension,
            source: rating.source,
            sourceName: rating.sourceName,
            maxScore: rating.maxScore,
            values: recordsInRequestOrder.map(() => null),
          };
        row.values[appIndex] = rating.score;
        ratingRows.set(key, row);
      }
    });
    const ratingDimensions = [...ratingRows.values()];

    const recommendations = buildRecommendations(
      recordsInRequestOrder,
      appPricing,
      currencies.size <= 1,
    );

    return {
      apps,
      basics,
      sections,
      pricing: {
        comparableCurrency: currencies.size <= 1,
        rows: pricingRows,
        plans: appPricing.map((pricing) => pricing.plans),
      },
      ratingDimensions,
      recommendations,
    };
  },
};
