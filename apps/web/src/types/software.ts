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

export type PlanType = 'FREE' | 'TRIAL' | 'PAID' | 'ENTERPRISE' | 'CUSTOM' | 'CONTACT_SALES';

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
  planType: PlanType;
  limits: unknown;
  isAvailable: boolean;
  lastVerifiedAt: string | null;
  refundPolicyUrl: string | null;
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

export interface Company {
  slug: string;
  name: string;
  websiteUrl: string | null;
  headquarters: string | null;
  foundedYear: number | null;
  companySize: string | null;
  description: string | null;
}
export type LinkType =
  | 'DOCS' | 'DEMO' | 'SIGNUP' | 'SUPPORT' | 'PRIVACY' | 'TOS' | 'API_DOCS' | 'CHANGELOG'
  | 'TWITTER' | 'LINKEDIN' | 'GITHUB' | 'YOUTUBE' | 'DISCORD' | 'FACEBOOK' | 'INSTAGRAM';
export interface SoftwareLink {
  type: LinkType;
  url: string;
  label: string | null;
}
export interface SoftwareMedia {
  type: 'COVER' | 'SCREENSHOT' | 'VIDEO';
  url: string;
  altText: string | null;
  caption: string | null;
  position: number;
}
export interface Audience {
  slug: string;
  name: string;
}
export interface PlanRef {
  slug: string;
  name: string;
}
export interface Capability {
  slug: string;
  name: string;
  shortDescription: string;
  detailedDescription: string | null;
  category: string | null;
  benefits: string[];
  docUrl: string | null;
  isVerified: boolean;
  availabilityStatus: 'AVAILABLE' | 'PLANNED' | 'UNAVAILABLE';
  minPlan: PlanRef | null;
}
export interface UseCase {
  slug: string;
  name: string;
  description: string;
  problem: string | null;
  industry: string | null;
  suggestedPlan: PlanRef | null;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedEffort: string | null;
}
export interface ProCon {
  type: 'PRO' | 'CON';
  description: string;
  category: string | null;
  severity: number | null;
  isEditorial: boolean;
  segment: string | null;
}
export interface Takeaway {
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
export interface Faq {
  question: string;
  answer: string;
}
export type RelationshipType =
  | 'ALTERNATIVE' | 'COMPETITOR' | 'SIMILAR' | 'INTEGRATION'
  | 'COMPLEMENTARY' | 'REPLACEMENT' | 'PREREQUISITE';
export interface RelatedSoftwareRef {
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  pricingType: PricingType;
}
export interface SoftwareRelationship {
  type: RelationshipType;
  reason: string | null;
  software: RelatedSoftwareRef;
}
export type RatingDimension =
  | 'OVERALL' | 'EASE_OF_USE' | 'FEATURES' | 'VALUE' | 'SUPPORT'
  | 'PERFORMANCE' | 'USER_EXPERIENCE' | 'INTEGRATION';
export interface Rating {
  dimension: RatingDimension;
  score: number;
  maxScore: number;
  source: 'EDITORIAL' | 'EXTERNAL' | 'USER_AGGREGATE';
  sourceName: string | null;
  reviewCount: number | null;
  calculationMethod: string | null;
  calculatedAt: string;
}
export interface PlanRecommendation {
  scenario: string;
  recommendedPlan: PlanRef;
  reasons: string;
  targetProfile: string | null;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  lastReviewedAt: string | null;
}
export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
export interface Review {
  id: number;
  displayName: string | null;
  rating: number;
  ratingDimensions: Record<string, number> | null;
  title: string | null;
  body: string;
  pros: string | null;
  cons: string | null;
  useCase: string | null;
  userRole: string | null;
  companySize: string | null;
  verifiedStatus: 'UNVERIFIED' | 'VERIFIED_USER' | 'VERIFIED_PURCHASE';
  reviewDate: string;
  helpfulVotes: number;
  publisherResponse: string | null;
}
export interface ReviewPage {
  items: Review[];
  page: number;
  limit: number;
  total: number;
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
  // Stage 1 profile fields (detail view only)
  longDescription?: string | null;
  overview?: string | null;
  howItWorks?: string | null;
  status?: 'ACTIVE' | 'BETA' | 'DISCONTINUED' | 'ACQUIRED';
  launchDate?: string | null;
  lastVerifiedAt?: string | null;
  lastMajorUpdateAt?: string | null;
  headquarters?: string | null;
  supportedLanguages?: string[];
  supportedRegions?: string[];
  deploymentOptions?: Array<'CLOUD' | 'ON_PREMISES' | 'SELF_HOSTED' | 'HYBRID'>;
  hasFreeTrial?: boolean;
  hasFreePlan?: boolean;
  isOpenSource?: boolean;
  licenseType?: string | null;
  categoryAttributes?: Record<string, unknown> | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  trendingStartAt?: string | null;
  trendingEndAt?: string | null;
  isTrending?: boolean;
  company?: Company | null;
  links?: SoftwareLink[];
  media?: SoftwareMedia[];
  audiences?: Audience[];
  capabilities?: Capability[];
  useCases?: UseCase[];
  prosCons?: ProCon[];
  takeaway?: Takeaway | null;
  faqs?: Faq[];
  relationships?: SoftwareRelationship[];
  ratings?: Rating[];
  planRecommendations?: PlanRecommendation[];
  reviewSummary?: ReviewSummary;
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
export interface ComparisonApp
  extends Pick<
    Software,
    | 'id' | 'slug' | 'name' | 'tagline' | 'description' | 'logoUrl' | 'pricingType' | 'platforms'
    | 'websiteUrl' | 'affiliateUrl' | 'popularity' | 'isVerified' | 'verifiedAt' | 'isTrending'
    | 'isOpenSource' | 'status' | 'launchDate' | 'lastVerifiedAt'
  > {
  companyName: string | null;
  category: string | null;
  ratings: Rating[];
  reviewSummary: ReviewSummary;
  audiences: Audience[];
  useCases: UseCase[];
  prosCons: ProCon[];
  deploymentOptions: string[];
  supportedLanguages: string[];
}
export interface ComparisonRatingRow {
  dimension: RatingDimension;
  source: Rating['source'];
  sourceName: string | null;
  maxScore: number;
  values: Array<number | null>;
}
export interface ComparisonRecommendation {
  scenario: string;
  label: string;
  winnerSlugs: string[];
  reason: string;
}
export interface Comparison {
  apps: ComparisonApp[];
  basics: CompareRow[];
  sections: CompareSection[];
  pricing: {
    comparableCurrency: boolean;
    rows: CompareRow[];
    plans: Plan[][];
  };
  ratingDimensions: ComparisonRatingRow[];
  recommendations: ComparisonRecommendation[];
}
