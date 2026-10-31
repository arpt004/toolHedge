export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
}

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'NEEDS_REVIEW';
export type SoftwareStatus = 'ACTIVE' | 'BETA' | 'DISCONTINUED' | 'ACQUIRED';
export type PricingType = 'FREE' | 'FREEMIUM' | 'PAID' | 'OPEN_SOURCE';
export type DeploymentOption = 'CLOUD' | 'ON_PREMISES' | 'SELF_HOSTED' | 'HYBRID';
export const PLATFORM_OPTIONS = ['Web', 'Windows', 'Mac', 'Linux', 'iOS', 'Android'] as const;

export interface AdminProductListItem {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  pricingType: PricingType;
  status: SoftwareStatus;
  contentStatus: ContentStatus;
  isVerified: boolean;
  popularity: number;
  createdAt: string;
  updatedAt: string;
  categories: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
  reviewCount: number;
}

export interface AdminProductListResult {
  items: AdminProductListItem[];
  page: number;
  limit: number;
  total: number;
  statusCounts: Partial<Record<ContentStatus, number>>;
}

export interface AdminProductDetail {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string | null;
  overview: string | null;
  howItWorks: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  affiliateUrl: string | null;
  pricingUrl: string | null;
  pricingType: PricingType;
  platforms: string[];
  status: SoftwareStatus;
  contentStatus: ContentStatus;
  deploymentOptions: DeploymentOption[];
  supportedLanguages: string[];
  supportedRegions: string[];
  headquarters: string | null;
  licenseType: string | null;
  isOpenSource: boolean;
  hasFreeTrial: boolean;
  hasFreePlan: boolean;
  isVerified: boolean;
  categories: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
  updatedAt: string;
  createdAt: string;
}

export interface AdminProductFormOptions {
  categories: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
}

export interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  softwareCount: number;
  filterCount: number;
}

export type FilterType = 'CHECKBOX' | 'SINGLE_SELECT' | 'BOOLEAN' | 'RANGE';
export type FilterSourceType = 'PRICING_TYPE' | 'PLATFORM' | 'TAG' | 'FEATURE';

export interface AdminFeatureOption {
  id: number;
  slug: string;
  name: string;
  type: 'boolean' | 'text' | 'number';
  group: { name: string };
}

export interface AdminFilterDefinition {
  id: number;
  key: string;
  label: string;
  type: FilterType;
  sourceType: FilterSourceType;
  featureId: number | null;
  feature: { id: number; slug: string; name: string; type: string } | null;
  options: Array<{ value: string; label: string }> | null;
  isEnabled: boolean;
  displayOrder: number;
  categories: Array<{ slug: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  statusCounts: Partial<Record<ContentStatus, number>>;
  totalCategories: number;
  totalFilters: number;
  enabledFilters: number;
  recentlyUpdated: Array<{
    id: number;
    slug: string;
    name: string;
    contentStatus: ContentStatus;
    updatedAt: string;
    logoUrl: string | null;
  }>;
}

export interface ApiErrorPayload {
  error: { code: string; message: string; details?: unknown };
}
