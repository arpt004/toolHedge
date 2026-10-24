-- AlterTable
ALTER TABLE "Software" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trendingEndAt" TIMESTAMP(3),
ADD COLUMN     "trendingStartAt" TIMESTAMP(3),
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
