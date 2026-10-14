CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "PricingType" AS ENUM ('FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE');

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
    "platforms" TEXT[] NOT NULL,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Software_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Software_slug_key" ON "Software"("slug");
CREATE INDEX "Software_popularity_idx" ON "Software"("popularity");
CREATE INDEX "Software_createdAt_idx" ON "Software"("createdAt");
CREATE INDEX "Software_name_trgm_idx" ON "Software" USING GIN ("name" gin_trgm_ops);
