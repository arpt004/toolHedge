import { ListSoftwareQuery } from './software.validation';
import { PricingSummary, RawPlan } from './pricing';

export interface SoftwareRecord {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  affiliateUrl: string | null;
  pricingUrl: string | null;
  pricingVerifiedAt: Date | string | null;
  isDemo: boolean;
  pricingType: 'FREE' | 'FREEMIUM' | 'PAID' | 'OPEN_SOURCE';
  platforms: string[];
  categories: Array<{ slug: string; name: string; icon?: string }>;
  tags: Array<{ slug: string; name: string }>;
  features?: Record<string, boolean | string | number | null>;
  featuresVerifiedAt?: Date | string | null;
  plans?: RawPlan[];
  pricingSummary?: PricingSummary;
  popularity: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SoftwareListResult {
  items: SoftwareRecord[];
  page: number;
  limit: number;
  total: number;
  facets: {
    categories: Array<{ slug: string; name: string; count: number }>;
    pricing: Array<{ value: SoftwareRecord['pricingType']; count: number }>;
    platforms: Array<{ value: string; count: number }>;
    tags: Array<{ slug: string; name: string; count: number }>;
  };
}

export interface CategoryRecord {
  slug: string;
  name: string;
  description: string;
  icon: string;
  softwareCount: number;
}

export type CompareFeatureValue = boolean | string | number | null;
export interface FeatureDefinition {
  slug: string;
  name: string;
  type: 'boolean' | 'text' | 'number';
}
export interface FeatureSection {
  title: string;
  features: FeatureDefinition[];
}
export interface SoftwareSuggestion {
  slug: string;
  name: string;
  logoUrl: string | null;
}
export interface SoftwareRepository {
  list(query: ListSoftwareQuery): Promise<SoftwareListResult>;
  getBySlug(slug: string): Promise<SoftwareRecord | null>;
  listCategories(): Promise<CategoryRecord[]>;
  getCategoryBySlug(slug: string): Promise<CategoryRecord | null>;
  getBySlugs(slugs: string[]): Promise<SoftwareRecord[]>;
  suggest(q: string): Promise<SoftwareSuggestion[]>;
  listFeatureSections(): Promise<FeatureSection[]>;
}