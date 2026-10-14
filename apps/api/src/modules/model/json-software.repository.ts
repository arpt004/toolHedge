import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ListSoftwareQuery } from '../software/software.validation';
import { CategoryRecord, FeatureSection, SoftwareRecord, SoftwareRepository, SoftwareSuggestion } from '../model/software-repository';
import { demoDataAllowed, enrichPricing } from './pricing';

type SoftwareSeed = Omit<SoftwareRecord, 'id' | 'updatedAt' | 'categories' | 'tags' | 'pricingSummary'> & {
  createdAt: string;
  categories: string[];
  tags: string[];
  features: Record<string, boolean | string | number | null>;
  featuresVerifiedAt: string;
};
type CategorySeed = Omit<CategoryRecord, 'softwareCount'>;
type FeatureSeedSection = { group: string; features: FeatureSection['features'] };

const tagName = (slug: string) => slug.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');

export class JsonSoftwareRepository implements SoftwareRepository {
  private readonly items: SoftwareRecord[];
  private readonly categories: CategorySeed[];
  private readonly featureSections: FeatureSection[];

  constructor() {
    const candidates = [
      resolve(process.cwd(), 'data/software.json'),
      resolve(process.cwd(), 'apps/api/data/software.json'),
      resolve(__dirname, '../../../data/software.json'),
      resolve(__dirname, '../../../../data/software.json'),
    ];
    const filePath = candidates.find(existsSync);
    if (!filePath) throw new Error(`Could not locate software.json. Checked: ${candidates.join(', ')}`);
    const data = JSON.parse(readFileSync(filePath, 'utf8')) as SoftwareSeed[];
    const categoriesPath = resolve(filePath, '../categories.json');
    this.categories = JSON.parse(readFileSync(categoriesPath, 'utf8')) as CategorySeed[];
    const featurePath = resolve(filePath, '../features.json');
    const featureSeed = JSON.parse(readFileSync(featurePath, 'utf8')) as FeatureSeedSection[];
    this.featureSections = featureSeed.map(section => ({ title: section.group, features: section.features }));
    const categoriesBySlug = new Map(this.categories.map(category => [category.slug, category]));
    this.items = data.filter(item => demoDataAllowed() || !item.isDemo).map((item, index) => ({
      ...item,
      id: index + 1,
      updatedAt: item.createdAt,
      categories: item.categories.map(slug => {
        const category = categoriesBySlug.get(slug);
        if (!category) throw new Error(`Unknown category slug in software.json: ${slug}`);
        return { slug: category.slug, name: category.name, icon: category.icon };
      }),
      tags: item.tags.map(slug => ({ slug, name: tagName(slug) })),
    }));
  }

  async list({ q, sort, page, limit, category, pricing, platform, tag }: ListSoftwareQuery) {
    const needle = q.toLocaleLowerCase();
    const filtered = this.items.filter(item =>
      (!needle || [item.name, item.tagline, item.description].some(value => value.toLocaleLowerCase().includes(needle)))
      && (!category.length || item.categories.some(value => category.includes(value.slug)))
      && (!pricing.length || pricing.includes(item.pricingType))
      && (!platform.length || item.platforms.some(value => (platform as string[]).includes(value)))
      && (!tag.length || item.tags.some(value => tag.includes(value.slug))),
    );

    const countBy = <T extends string>(values: T[]) => {
      const counts = new Map<T, number>();
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
      return counts;
    };
    const categoryCounts = countBy(filtered.flatMap(item => item.categories.map(value => value.slug)));
    const pricingCounts = countBy(filtered.map(item => item.pricingType));
    const platformCounts = countBy(filtered.flatMap(item => item.platforms));
    const tagCounts = countBy(filtered.flatMap(item => item.tags.map(value => value.slug)));
    const categoryNames = new Map(this.categories.map(value => [value.slug, value.name]));
    const facets = {
      categories: [...categoryCounts].map(([slug, count]) => ({ slug, name: categoryNames.get(slug) ?? slug, count })).sort((a, b) => a.name.localeCompare(b.name)),
      pricing: [...pricingCounts].map(([value, count]) => ({ value, count })),
      platforms: [...platformCounts].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
      tags: [...tagCounts].map(([slug, count]) => ({ slug, name: tagName(slug), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    };

    const sorted = [...filtered].sort((left, right) => {
      switch (sort) {
        case 'name_asc': return left.name.localeCompare(right.name);
        case 'name_desc': return right.name.localeCompare(left.name);
        case 'newest': return Date.parse(String(right.createdAt)) - Date.parse(String(left.createdAt));
        case 'popular': return right.popularity - left.popularity;
      }
    });

    const start = (page - 1) * limit;
    return {
      items: sorted.slice(start, start + limit).map(item => {
        const plans = item.plans ?? [];
        const { plans: _plans, ...fields } = item;
        return { ...fields, pricingSummary: enrichPricing(plans ?? []).pricingSummary };
      }),
      page, limit, total: filtered.length, facets,
    };
  }

  async getBySlug(slug: string) {
    const item = this.items.find(record => record.slug === slug);
    return item ? { ...item, ...enrichPricing(item.plans ?? []) } : null;
  }

  async listCategories(): Promise<CategoryRecord[]> {
    return this.categories.map(category => ({
      ...category,
      softwareCount: this.items.filter(item => item.categories.some(value => value.slug === category.slug)).length,
    }));
  }

  async getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    return (await this.listCategories()).find(category => category.slug === slug) ?? null;
  }

  async getBySlugs(slugs: string[]): Promise<SoftwareRecord[]> {
    const requested = new Set(slugs);
    return this.items.filter(item => requested.has(item.slug)).map(item => ({ ...item, ...enrichPricing(item.plans ?? []) }));
  }

  async suggest(q: string): Promise<SoftwareSuggestion[]> {
    const needle = q.trim().toLocaleLowerCase();
    if (!needle) return [];
    return this.items
      .filter(item => [item.name, item.tagline, item.description].some(value => value.toLocaleLowerCase().includes(needle)) || item.slug.includes(needle))
      .sort((left, right) => right.popularity - left.popularity)
      .slice(0, 8)
      .map(({ slug, name, logoUrl }) => ({ slug, name, logoUrl }));
  }

  async listFeatureSections(): Promise<FeatureSection[]> {
    return this.featureSections;
  }
}