CREATE TYPE "BillingUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');
CREATE TYPE "BillingType" AS ENUM ('RECURRING', 'ONE_TIME', 'LIFETIME');
CREATE TYPE "PricingModel" AS ENUM ('FLAT', 'PER_USER', 'USAGE', 'CUSTOM');

ALTER TABLE "Software"
  ADD COLUMN "pricingUrl" TEXT,
  ADD COLUMN "pricingVerifiedAt" DATE,
  ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

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
  "highlights" TEXT[] NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanPrice" (
  "id" SERIAL NOT NULL,
  "planId" INTEGER NOT NULL,
  "billing" "BillingType" NOT NULL,
  "intervalUnit" "BillingUnit",
  "intervalCount" INTEGER,
  "amount" DECIMAL(12,2),
  "currency" TEXT NOT NULL,
  "note" TEXT,
  CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_softwareId_slug_key" ON "Plan"("softwareId", "slug");
CREATE INDEX "Plan_softwareId_position_idx" ON "Plan"("softwareId", "position");
CREATE INDEX "PlanPrice_planId_idx" ON "PlanPrice"("planId");

ALTER TABLE "Plan" ADD CONSTRAINT "Plan_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
