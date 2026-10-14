import { getSoftwareRepository } from '../model/software-repository.factory';
import { CompareFeatureValue, FeatureSection } from '../model/software-repository';
import { enrichPricing, formatIntervalLabel } from '../model/pricing';
import { ListSoftwareQuery } from './software.validation';

export class MissingSoftwareError extends Error {
  constructor(readonly slug: string) {
    super(`Software '${slug}' was not found`);
    this.name = 'MissingSoftwareError';
  }
}

const isDifferent = (values: CompareFeatureValue[]) => {
  const known = values.filter((value): value is Exclude<CompareFeatureValue, null> => value !== null);
  return known.length > 1 && known.some(value => JSON.stringify(value) !== JSON.stringify(known[0]));
};

const makeRow = (slug: string, label: string, type: FeatureSection['features'][number]['type'], values: CompareFeatureValue[]) => ({
  slug, label, type, values, isDifferent: isDifferent(values),
});

export const softwareService = {
  async list(query: ListSoftwareQuery) {
    return (await getSoftwareRepository()).list(query);
  },
  async getBySlug(slug: string) {
    return (await getSoftwareRepository()).getBySlug(slug);
  },
  async listCategories() {
    return (await getSoftwareRepository()).listCategories();
  },
  async getCategoryBySlug(slug: string) {
    return (await getSoftwareRepository()).getCategoryBySlug(slug);
  },
  async suggest(q: string) {
    return (await getSoftwareRepository()).suggest(q);
  },
  async compare(slugs: string[]) {
    const repository = await getSoftwareRepository();
    const [records, featureSections] = await Promise.all([repository.getBySlugs(slugs), repository.listFeatureSections()]);
    const bySlug = new Map(records.map(record => [record.slug, record]));
    const missing = slugs.find(slug => !bySlug.has(slug));
    if (missing) throw new MissingSoftwareError(missing);
    const recordsInRequestOrder = slugs.map(slug => bySlug.get(slug)!);
    const apps = recordsInRequestOrder.map(({ id, slug, name, tagline, logoUrl, pricingType, platforms, websiteUrl, affiliateUrl, popularity }) => ({
      id, slug, name, tagline, logoUrl, pricingType, platforms, websiteUrl, affiliateUrl, popularity,
    }));
    const sections = featureSections.map(section => ({
      title: section.title,
      rows: section.features.map(feature => makeRow(
        feature.slug,
        feature.name,
        feature.type,
        recordsInRequestOrder.map(record => record.features?.[feature.slug] ?? null),
      )),
    }));
    const basics = [
      makeRow('pricing-type', 'Pricing type', 'text', recordsInRequestOrder.map(record => record.pricingType)),
      makeRow('platforms', 'Platforms', 'text', recordsInRequestOrder.map(record => record.platforms.join(', '))),
    ];
    const appPricing = recordsInRequestOrder.map(record => enrichPricing(record.plans ?? []));
    const currencies = new Set(appPricing.flatMap(pricing => pricing.plans.flatMap(plan => plan.prices.map(price => price.currency))));
    const pricingValues: CompareFeatureValue[][] = [
      appPricing.map(pricing => pricing.pricingSummary.hasFreePlan),
      appPricing.map(pricing => pricing.pricingSummary.hasFreeTrial ? pricing.pricingSummary.trialDays : null),
      appPricing.map(pricing => pricing.pricingSummary.startingPrice ? `${pricing.pricingSummary.startingPrice.monthlyEquivalent} ${pricing.pricingSummary.startingPrice.currency}/month` : null),
      appPricing.map(pricing => pricing.pricingSummary.billingOptions.join(', ') || null),
      appPricing.map(pricing => {
        const annual = pricing.plans.flatMap(plan => plan.prices)
          .filter(price => price.billing === 'RECURRING' && price.yearlyEquivalent !== null)
          .sort((left, right) => left.yearlyEquivalent! - right.yearlyEquivalent!)[0];
        return annual ? `${annual.yearlyEquivalent} ${annual.currency}/year` : null;
      }),
      appPricing.map(pricing => pricing.pricingSummary.hasOneTimeOrLifetime),
      appPricing.map(pricing => pricing.pricingSummary.hasCustomPricing),
    ];
    const pricingLabels = [
      ['free-plan', 'Free plan', 'boolean'],
      ['free-trial', 'Free trial (days)', 'number'],
      ['starting-price', 'Starting price', 'text'],
      ['billing-options', 'Billing options', 'text'],
      ['cheapest-yearly-cost', 'Cheapest yearly cost', 'text'],
      ['one-time-or-lifetime', 'One-time/lifetime option', 'boolean'],
      ['custom-pricing', 'Custom pricing', 'boolean'],
    ] as const;
    const pricingRows = pricingLabels.map(([slug, label, type], index) => makeRow(slug, label, type, pricingValues[index]));
    return {
      apps,
      basics,
      sections,
      pricing: {
        comparableCurrency: currencies.size <= 1,
        rows: pricingRows,
        plans: appPricing.map(pricing => pricing.plans),
      },
    };
  },
};
