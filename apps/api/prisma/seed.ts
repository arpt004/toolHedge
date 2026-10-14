import { BillingType, BillingUnit, PrismaClient, PricingModel, PricingType } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type SoftwareSeed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  affiliateUrl: string | null;
  pricingUrl: string | null;
  pricingVerifiedAt: string | null;
  isDemo: boolean;
  plans: PlanSeed[];
  pricingType: PricingType;
  platforms: string[];
  categories: string[];
  tags: string[];
  features: Record<string, boolean | string | number | null>;
  featuresVerifiedAt: string | null;
  popularity: number;
  createdAt: string;
};
type PlanPriceSeed = {
  billing: BillingType;
  interval?: { unit: BillingUnit; count: number };
  amount: number | null;
  currency: string;
  note: string | null;
};
type PlanSeed = {
  slug: string;
  name: string;
  description: string | null;
  isFree: boolean;
  isRecommended: boolean;
  trialDays: number | null;
  pricingModel: PricingModel;
  seatsNote?: string;
  highlights: string[];
  prices: PlanPriceSeed[];
};
type CategorySeed = { slug: string; name: string; description: string; icon: string };
type FeatureSeed = { slug: string; name: string; type: 'boolean' | 'text' | 'number' };
type FeatureGroupSeed = { group: string; features: FeatureSeed[] };

const prisma = new PrismaClient();
const softwarePath = resolve(__dirname, '../data/software.json');
const categoriesPath = resolve(__dirname, '../data/categories.json');
const featuresPath = resolve(__dirname, '../data/features.json');
const software = JSON.parse(readFileSync(softwarePath, 'utf8')) as SoftwareSeed[];
const categories = JSON.parse(readFileSync(categoriesPath, 'utf8')) as CategorySeed[];
const featureGroups = JSON.parse(readFileSync(featuresPath, 'utf8')) as FeatureGroupSeed[];
const titleFromSlug = (slug: string) => slug.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: category, create: category });
  }

  const tagSlugs = [...new Set(software.flatMap(entry => entry.tags))];
  for (const slug of tagSlugs) {
    const data = { slug, name: titleFromSlug(slug) };
    await prisma.tag.upsert({ where: { slug }, update: data, create: data });
  }

  const featureIds = new Map<string, number>();
  for (const [sortOrder, section] of featureGroups.entries()) {
    const group = await prisma.featureGroup.upsert({ where: { name: section.group }, update: { sortOrder }, create: { name: section.group, sortOrder } });
    for (const feature of section.features) {
      const saved = await prisma.feature.upsert({
        where: { slug: feature.slug },
        update: { name: feature.name, type: feature.type, groupId: group.id },
        create: { ...feature, groupId: group.id },
      });
      featureIds.set(feature.slug, saved.id);
    }
  }

  for (const entry of software) {
    const { slug, createdAt, pricingVerifiedAt, featuresVerifiedAt, features, categories: categorySlugs, tags: tagSlugsForSoftware, plans, ...fields } = entry;
    const common = {
      ...fields,
      featuresVerifiedAt: featuresVerifiedAt ? new Date(featuresVerifiedAt) : null,
      pricingVerifiedAt: pricingVerifiedAt ? new Date(pricingVerifiedAt) : null,
      createdAt: new Date(createdAt),
    };
    const savedSoftware = await prisma.software.upsert({
      where: { slug },
      update: {
        ...common,
        featuresVerifiedAt: featuresVerifiedAt ? new Date(featuresVerifiedAt) : null,
        categories: { set: categorySlugs.map(categorySlug => ({ slug: categorySlug })) },
        tags: { set: tagSlugsForSoftware.map(tagSlug => ({ slug: tagSlug })) },
      },
      create: {
        slug,
        ...common,
        featuresVerifiedAt: featuresVerifiedAt ? new Date(featuresVerifiedAt) : null,
        categories: { connect: categorySlugs.map(categorySlug => ({ slug: categorySlug })) },
        tags: { connect: tagSlugsForSoftware.map(tagSlug => ({ slug: tagSlug })) },
      },
    });
    for (const [position, plan] of plans.entries()) {
      const planData = {
        name: plan.name,
        description: plan.description,
        isFree: plan.isFree,
        isRecommended: plan.isRecommended,
        trialDays: plan.trialDays,
        pricingModel: plan.pricingModel,
        seatsNote: plan.seatsNote ?? null,
        highlights: plan.highlights,
        position,
      };
      const priceData = plan.prices.map(price => ({
        billing: price.billing,
        intervalUnit: price.billing === 'RECURRING' ? price.interval?.unit ?? null : null,
        intervalCount: price.billing === 'RECURRING' ? price.interval?.count ?? null : null,
        amount: price.amount,
        currency: price.currency,
        note: price.note,
      }));
      await prisma.plan.upsert({
        where: { softwareId_slug: { softwareId: savedSoftware.id, slug: plan.slug } },
        update: { ...planData, prices: { deleteMany: {}, create: priceData } },
        create: { ...planData, slug: plan.slug, softwareId: savedSoftware.id, prices: { create: priceData } },
      });
    }
    for (const feature of featureGroups.flatMap(section => section.features)) {
      const featureId = featureIds.get(feature.slug);
      if (featureId === undefined) throw new Error(`Missing database feature id for ${feature.slug}`);
      const value = features[feature.slug] ?? null;
      const typedValue = {
        valueBool: typeof value === 'boolean' ? value : null,
        valueText: typeof value === 'string' ? value : null,
        valueNum: typeof value === 'number' ? value : null,
      };
      await prisma.softwareFeature.upsert({
        where: { softwareId_featureId: { softwareId: savedSoftware.id, featureId } },
        update: typedValue,
        create: { softwareId: savedSoftware.id, featureId, ...typedValue },
      });
    }
  }
  console.log(`Seeded ${categories.length} categories, ${featureIds.size} comparison features, ${software.reduce((count, entry) => count + entry.plans.length, 0)} plans and ${software.length} software entries from JSON.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
