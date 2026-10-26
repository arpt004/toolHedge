-- Consolidated baseline migration.
-- admin@toolhedge.dev / ChangeMe123! 
--
-- Replaces the previous history (20261024000000_init,
-- 20261024143740_verification_trending) with one CREATE-only script that
-- builds the full current schema from an empty database. Foreign keys are
-- defined inline on each CREATE TABLE (tables ordered so every referenced
-- table is created first) instead of as separate ALTER TABLE statements —
-- no ALTER statements of any kind remain in this file.
--
-- The live database already has this exact schema; this migration was
-- applied via `prisma migrate resolve --applied` rather than executed,
-- so it is safe to re-run against a fresh/empty database if needed.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE');

-- CreateEnum
CREATE TYPE "BillingUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('RECURRING', 'ONE_TIME', 'LIFETIME');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('FLAT', 'PER_USER', 'USAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SoftwareStatus" AS ENUM ('ACTIVE', 'BETA', 'DISCONTINUED', 'ACQUIRED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "DeploymentOption" AS ENUM ('CLOUD', 'ON_PREMISES', 'SELF_HOSTED', 'HYBRID');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SOLO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('DOCS', 'DEMO', 'SIGNUP', 'SUPPORT', 'PRIVACY', 'TOS', 'API_DOCS', 'CHANGELOG', 'TWITTER', 'LINKEDIN', 'GITHUB', 'YOUTUBE', 'DISCORD', 'FACEBOOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('COVER', 'SCREENSHOT', 'VIDEO');

-- CreateEnum
CREATE TYPE "CapabilityAvailability" AS ENUM ('AVAILABLE', 'PLANNED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProConType" AS ENUM ('PRO', 'CON');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('ALTERNATIVE', 'COMPETITOR', 'SIMILAR', 'INTEGRATION', 'COMPLEMENTARY', 'REPLACEMENT', 'PREREQUISITE');

-- CreateEnum
CREATE TYPE "RatingDimension" AS ENUM ('OVERALL', 'EASE_OF_USE', 'FEATURES', 'VALUE', 'SUPPORT', 'PERFORMANCE', 'USER_EXPERIENCE', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "RatingSource" AS ENUM ('EDITORIAL', 'EXTERNAL', 'USER_AGGREGATE');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReviewVerifiedStatus" AS ENUM ('UNVERIFIED', 'VERIFIED_USER', 'VERIFIED_PURCHASE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'TRIAL', 'PAID', 'ENTERPRISE', 'CUSTOM', 'CONTACT_SALES');

-- CreateTable (no FKs)
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "headquarters" TEXT,
    "foundedYear" INTEGER,
    "companySize" "CompanySize",
    "description" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable (no FKs)
CREATE TABLE "FeatureGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeatureGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable (no FKs)
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable (no FKs)
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable (no FKs)
CREATE TABLE "Audience" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Audience_pkey" PRIMARY KEY ("id")
);

-- CreateTable (no FKs)
CREATE TABLE "Capability" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "detailedDescription" TEXT,
    "category" TEXT,
    "benefits" TEXT[],
    "docUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable (FK: companyId -> Company)
CREATE TABLE "Software" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "affiliateUrl" TEXT,
    "pricingType" "PricingType" NOT NULL,
    "platforms" TEXT[],
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "featuresVerifiedAt" DATE,
    "pricingUrl" TEXT,
    "pricingVerifiedAt" DATE,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "longDescription" TEXT,
    "overview" TEXT,
    "howItWorks" TEXT,
    "status" "SoftwareStatus" NOT NULL DEFAULT 'ACTIVE',
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "launchDate" DATE,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastMajorUpdateAt" DATE,
    "headquarters" TEXT,
    "supportedLanguages" TEXT[],
    "supportedRegions" TEXT[],
    "deploymentOptions" "DeploymentOption"[],
    "hasFreeTrial" BOOLEAN NOT NULL DEFAULT false,
    "hasFreePlan" BOOLEAN NOT NULL DEFAULT false,
    "isOpenSource" BOOLEAN NOT NULL DEFAULT false,
    "licenseType" TEXT,
    "categoryAttributes" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "trendingStartAt" TIMESTAMP(3),
    "trendingEndAt" TIMESTAMP(3),
    "companyId" INTEGER,

    CONSTRAINT "Software_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Software_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable (FK: groupId -> FeatureGroup)
CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Feature_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FeatureGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER,
    "pricingModel" "PricingModel" NOT NULL,
    "seatsNote" TEXT,
    "highlights" TEXT[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "planType" "PlanType" NOT NULL DEFAULT 'PAID',
    "limits" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "refundPolicyUrl" TEXT,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Plan_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: planId -> Plan)
CREATE TABLE "PlanPrice" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "billing" "BillingType" NOT NULL,
    "intervalUnit" "BillingUnit",
    "intervalCount" INTEGER,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software, featureId -> Feature)
CREATE TABLE "SoftwareFeature" (
    "softwareId" INTEGER NOT NULL,
    "featureId" INTEGER NOT NULL,
    "valueBool" BOOLEAN,
    "valueText" TEXT,
    "valueNum" DOUBLE PRECISION,

    CONSTRAINT "SoftwareFeature_pkey" PRIMARY KEY ("softwareId","featureId"),
    CONSTRAINT "SoftwareFeature_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoftwareFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "SoftwareLink" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "type" "LinkType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "SoftwareLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareLink_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "SoftwareMedia" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SoftwareMedia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareMedia_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software, audienceId -> Audience)
CREATE TABLE "SoftwareAudience" (
    "softwareId" INTEGER NOT NULL,
    "audienceId" INTEGER NOT NULL,

    CONSTRAINT "SoftwareAudience_pkey" PRIMARY KEY ("softwareId","audienceId"),
    CONSTRAINT "SoftwareAudience_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoftwareAudience_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software, capabilityId -> Capability, minPlanId -> Plan)
CREATE TABLE "SoftwareCapability" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "capabilityId" INTEGER NOT NULL,
    "availabilityStatus" "CapabilityAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "minPlanId" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SoftwareCapability_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareCapability_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoftwareCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoftwareCapability_minPlanId_fkey" FOREIGN KEY ("minPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software, suggestedPlanId -> Plan)
CREATE TABLE "UseCase" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "problem" TEXT,
    "industry" TEXT,
    "suggestedPlanId" INTEGER,
    "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "estimatedEffort" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UseCase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UseCase_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UseCase_suggestedPlanId_fkey" FOREIGN KEY ("suggestedPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "SoftwareProCon" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "type" "ProConType" NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "severity" INTEGER,
    "isEditorial" BOOLEAN NOT NULL DEFAULT true,
    "segment" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SoftwareProCon_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareProCon_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "SoftwareTakeaway" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "mainValueProp" TEXT,
    "biggestStrength" TEXT,
    "bestUseCase" TEXT,
    "bestFitAudience" TEXT,
    "standoutFeature" TEXT,
    "pricingTakeaway" TEXT,
    "mainLimitation" TEXT,
    "bestReasonToChoose" TEXT,
    "importantConsideration" TEXT,

    CONSTRAINT "SoftwareTakeaway_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareTakeaway_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "SoftwareFaq" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SoftwareFaq_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareFaq_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: fromSoftwareId -> Software, toSoftwareId -> Software)
CREATE TABLE "SoftwareRelationship" (
    "id" SERIAL NOT NULL,
    "fromSoftwareId" INTEGER NOT NULL,
    "toSoftwareId" INTEGER NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "reason" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SoftwareRelationship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoftwareRelationship_fromSoftwareId_fkey" FOREIGN KEY ("fromSoftwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoftwareRelationship_toSoftwareId_fkey" FOREIGN KEY ("toSoftwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "dimension" "RatingDimension" NOT NULL,
    "score" DECIMAL(3,2) NOT NULL,
    "maxScore" DECIMAL(3,2) NOT NULL DEFAULT 5,
    "source" "RatingSource" NOT NULL,
    "sourceName" TEXT,
    "reviewCount" INTEGER,
    "calculationMethod" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Rating_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software, recommendedPlanId -> Plan)
CREATE TABLE "PlanRecommendation" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "scenario" TEXT NOT NULL,
    "recommendedPlanId" INTEGER NOT NULL,
    "reasons" TEXT NOT NULL,
    "targetProfile" TEXT,
    "confidenceLevel" "ConfidenceLevel",
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "PlanRecommendation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlanRecommendation_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanRecommendation_recommendedPlanId_fkey" FOREIGN KEY ("recommendedPlanId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable (FK: softwareId -> Software)
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "softwareId" INTEGER NOT NULL,
    "displayName" TEXT,
    "rating" INTEGER NOT NULL,
    "ratingDimensions" JSONB,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "pros" TEXT,
    "cons" TEXT,
    "useCase" TEXT,
    "userRole" TEXT,
    "companySize" TEXT,
    "verifiedStatus" "ReviewVerifiedStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "publisherResponse" TEXT,
    "source" TEXT,
    "disclosureInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: A -> Software, B -> Tag)
CREATE TABLE "_SoftwareToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SoftwareToTag_AB_pkey" PRIMARY KEY ("A","B"),
    CONSTRAINT "_SoftwareToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SoftwareToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (FK: A -> Category, B -> Software)
CREATE TABLE "_CategoryToSoftware" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToSoftware_AB_pkey" PRIMARY KEY ("A","B"),
    CONSTRAINT "_CategoryToSoftware_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryToSoftware_B_fkey" FOREIGN KEY ("B") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Software_slug_key" ON "Software"("slug");

-- CreateIndex
CREATE INDEX "Software_popularity_idx" ON "Software"("popularity");

-- CreateIndex
CREATE INDEX "Software_createdAt_idx" ON "Software"("createdAt");

-- CreateIndex
CREATE INDEX "Software_companyId_idx" ON "Software"("companyId");

-- CreateIndex
CREATE INDEX "Software_contentStatus_idx" ON "Software"("contentStatus");

-- CreateIndex
CREATE INDEX "Software_name_trgm_idx" ON "Software" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Plan_softwareId_position_idx" ON "Plan"("softwareId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_softwareId_slug_key" ON "Plan"("softwareId", "slug");

-- CreateIndex
CREATE INDEX "PlanPrice_planId_idx" ON "PlanPrice"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureGroup_name_key" ON "FeatureGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_slug_key" ON "Feature"("slug");

-- CreateIndex
CREATE INDEX "Feature_groupId_idx" ON "Feature"("groupId");

-- CreateIndex
CREATE INDEX "SoftwareFeature_featureId_idx" ON "SoftwareFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareLink_softwareId_type_key" ON "SoftwareLink"("softwareId", "type");

-- CreateIndex
CREATE INDEX "SoftwareMedia_softwareId_position_idx" ON "SoftwareMedia"("softwareId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Audience_slug_key" ON "Audience"("slug");

-- CreateIndex
CREATE INDEX "SoftwareAudience_audienceId_idx" ON "SoftwareAudience"("audienceId");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_slug_key" ON "Capability"("slug");

-- CreateIndex
CREATE INDEX "SoftwareCapability_capabilityId_idx" ON "SoftwareCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "SoftwareCapability_minPlanId_idx" ON "SoftwareCapability"("minPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareCapability_softwareId_capabilityId_key" ON "SoftwareCapability"("softwareId", "capabilityId");

-- CreateIndex
CREATE INDEX "UseCase_suggestedPlanId_idx" ON "UseCase"("suggestedPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_softwareId_slug_key" ON "UseCase"("softwareId", "slug");

-- CreateIndex
CREATE INDEX "SoftwareProCon_softwareId_type_idx" ON "SoftwareProCon"("softwareId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareTakeaway_softwareId_key" ON "SoftwareTakeaway"("softwareId");

-- CreateIndex
CREATE INDEX "SoftwareFaq_softwareId_position_idx" ON "SoftwareFaq"("softwareId", "position");

-- CreateIndex
CREATE INDEX "SoftwareRelationship_toSoftwareId_idx" ON "SoftwareRelationship"("toSoftwareId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareRelationship_fromSoftwareId_toSoftwareId_type_key" ON "SoftwareRelationship"("fromSoftwareId", "toSoftwareId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_softwareId_dimension_source_sourceName_key" ON "Rating"("softwareId", "dimension", "source", "sourceName");

-- CreateIndex
CREATE INDEX "PlanRecommendation_recommendedPlanId_idx" ON "PlanRecommendation"("recommendedPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanRecommendation_softwareId_scenario_key" ON "PlanRecommendation"("softwareId", "scenario");

-- CreateIndex
CREATE INDEX "Review_softwareId_moderationStatus_idx" ON "Review"("softwareId", "moderationStatus");

-- CreateIndex
CREATE INDEX "_SoftwareToTag_B_index" ON "_SoftwareToTag"("B");

-- CreateIndex
CREATE INDEX "_CategoryToSoftware_B_index" ON "_CategoryToSoftware"("B");
