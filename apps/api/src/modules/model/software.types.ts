import { ListReviewsQuery, ListSoftwareQuery } from './software.validation';
import { PricingSummary, RawPlan } from './pricing';

export interface CompanyRecord {
  slug: string;
  name: string;
  websiteUrl: string | null;
  headquarters: string | null;
  foundedYear: number | null;
  companySize: string | null;
  description: string | null;
}
export interface SoftwareLinkRecord {
  type: string;
  url: string;
  label: string | null;
}
export interface SoftwareMediaRecord {
  type: string;
  url: string;
  altText: string | null;
  caption: string | null;
  position: number;
}
export interface AudienceRecord {
  slug: string;
  name: string;
}
export interface PlanRef {
  slug: string;
  name: string;
}
export interface CapabilityRecord {
  slug: string;
  name: string;
  shortDescription: string;
  detailedDescription: string | null;
  category: string | null;
  benefits: string[];
  docUrl: string | null;
  isVerified: boolean;
  availabilityStatus: string;
  minPlan: PlanRef | null;
}
export interface UseCaseRecord {
  slug: string;
  name: string;
  description: string;
  problem: string | null;
  industry: string | null;
  suggestedPlan: PlanRef | null;
  difficultyLevel: string;
  estimatedEffort: string | null;
}
export interface ProConRecord {
  type: 'PRO' | 'CON';
  description: string;
  category: string | null;
  severity: number | null;
  isEditorial: boolean;
  segment: string | null;
}
export interface TakeawayRecord {
  mainValueProp: string | null;
  biggestStrength: string | null;
  bestUseCase: string | null;
  bestFitAudience: string | null;
  standoutFeature: string | null;
  pricingTakeaway: string | null;
  mainLimitation: string | null;
  bestReasonToChoose: string | null;
  importantConsideration: string | null;
}
export interface FaqRecord {
  question: string;
  answer: string;
}
export interface RelatedSoftwareRef {
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  pricingType: string;
}
export interface SoftwareRelationshipRecord {
  type: string;
  reason: string | null;
  software: RelatedSoftwareRef;
}
export interface RatingRecord {
  dimension: string;
  score: number;
  maxScore: number;
  source: string;
  sourceName: string | null;
  reviewCount: number | null;
  calculationMethod: string | null;
  calculatedAt: Date | string;
}
export interface PlanRecommendationRecord {
  scenario: string;
  recommendedPlan: PlanRef;
  reasons: string;
  targetProfile: string | null;
  confidenceLevel: string | null;
  lastReviewedAt: Date | string | null;
}
export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
export interface ReviewRecord {
  id: number;
  displayName: string | null;
  rating: number;
  ratingDimensions: unknown;
  title: string | null;
  body: string;
  pros: string | null;
  cons: string | null;
  useCase: string | null;
  userRole: string | null;
  companySize: string | null;
  verifiedStatus: string;
  reviewDate: Date | string;
  helpfulVotes: number;
  publisherResponse: string | null;
}
export interface ReviewPage {
  items: ReviewRecord[];
  page: number;
  limit: number;
  total: number;
}

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
  // Stage 1 profile fields (detail view only)
  longDescription?: string | null;
  overview?: string | null;
  howItWorks?: string | null;
  status?: string;
  launchDate?: Date | string | null;
  lastVerifiedAt?: Date | string | null;
  lastMajorUpdateAt?: Date | string | null;
  headquarters?: string | null;
  supportedLanguages?: string[];
  supportedRegions?: string[];
  deploymentOptions?: string[];
  hasFreeTrial?: boolean;
  hasFreePlan?: boolean;
  isOpenSource?: boolean;
  licenseType?: string | null;
  categoryAttributes?: unknown;
  isVerified?: boolean;
  verifiedAt?: Date | string | null;
  trendingStartAt?: Date | string | null;
  trendingEndAt?: Date | string | null;
  isTrending?: boolean;
  company?: CompanyRecord | null;
  links?: SoftwareLinkRecord[];
  media?: SoftwareMediaRecord[];
  audiences?: AudienceRecord[];
  capabilities?: CapabilityRecord[];
  useCases?: UseCaseRecord[];
  prosCons?: ProConRecord[];
  takeaway?: TakeawayRecord | null;
  faqs?: FaqRecord[];
  relationships?: SoftwareRelationshipRecord[];
  ratings?: RatingRecord[];
  planRecommendations?: PlanRecommendationRecord[];
  reviewSummary?: ReviewSummary;
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
  listReviews(slug: string, query: ListReviewsQuery): Promise<ReviewPage>;
}