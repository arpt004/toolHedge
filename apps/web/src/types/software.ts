export type PricingType = 'FREE' | 'FREEMIUM' | 'PAID' | 'OPEN_SOURCE';
export type BillingUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type BillingType = 'RECURRING' | 'ONE_TIME' | 'LIFETIME';
export type PricingModel = 'FLAT' | 'PER_USER' | 'USAGE' | 'CUSTOM';

export interface PlanPrice {
  billing: BillingType;
  interval: { unit: BillingUnit; count: number } | null;
  amount: number | null;
  currency: string;
  note: string | null;
  monthlyEquivalent: number | null;
  yearlyEquivalent: number | null;
  savingsVsMonthlyPercent: number | null;
  label: string;
}

export interface Plan {
  slug: string;
  name: string;
  description: string | null;
  isFree: boolean;
  isRecommended: boolean;
  trialDays: number | null;
  pricingModel: PricingModel;
  seatsNote?: string | null;
  highlights: string[];
  position?: number;
  prices: PlanPrice[];
}

export interface PricingSummary {
  hasFreePlan: boolean;
  hasFreeTrial: boolean;
  trialDays: number | null;
  startingPrice: null | { amount: number; currency: string; intervalLabel: string; monthlyEquivalent: number; planName: string };
  billingOptions: string[];
  hasCustomPricing: boolean;
  hasOneTimeOrLifetime: boolean;
}

export interface Software {
  id: number;
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
  pricingType: PricingType;
  platforms: string[];
  categories: Array<{ slug: string; name: string; icon?: string }>;
  tags: Array<{ slug: string; name: string }>;
  popularity: number;
  plans?: Plan[];
  pricingSummary?: PricingSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareList {
  items: Software[];
  page: number;
  limit: number;
  total: number;
  facets: {
    categories: Array<{ slug: string; name: string; count: number }>;
    pricing: Array<{ value: PricingType; count: number }>;
    platforms: Array<{ value: string; count: number }>;
    tags: Array<{ slug: string; name: string; count: number }>;
  };
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  softwareCount: number;
}

export interface SoftwareSuggestion {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export type CompareValue = boolean | string | number | null;
export interface CompareRow {
  slug: string;
  label: string;
  type: 'boolean' | 'text' | 'number';
  values: CompareValue[];
  isDifferent: boolean;
}
export interface CompareSection {
  title: string;
  rows: CompareRow[];
}
export interface Comparison {
  apps: Array<Pick<Software, 'id' | 'slug' | 'name' | 'tagline' | 'logoUrl' | 'pricingType' | 'platforms' | 'websiteUrl' | 'affiliateUrl' | 'popularity'>>;
  basics: CompareRow[];
  sections: CompareSection[];
  pricing: {
    comparableCurrency: boolean;
    rows: CompareRow[];
    plans: Plan[][];
  };
}
