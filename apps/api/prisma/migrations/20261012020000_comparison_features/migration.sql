ALTER TABLE "Software" ADD COLUMN "featuresVerifiedAt" DATE;

CREATE TABLE "FeatureGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FeatureGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SoftwareFeature" (
    "softwareId" INTEGER NOT NULL,
    "featureId" INTEGER NOT NULL,
    "valueBool" BOOLEAN,
    "valueText" TEXT,
    "valueNum" DOUBLE PRECISION,
    CONSTRAINT "SoftwareFeature_pkey" PRIMARY KEY ("softwareId", "featureId"),
    CONSTRAINT "SoftwareFeature_one_value" CHECK (num_nonnulls("valueBool", "valueText", "valueNum") <= 1)
);

CREATE UNIQUE INDEX "FeatureGroup_name_key" ON "FeatureGroup"("name");
CREATE UNIQUE INDEX "Feature_slug_key" ON "Feature"("slug");
CREATE INDEX "Feature_groupId_idx" ON "Feature"("groupId");
CREATE INDEX "SoftwareFeature_featureId_idx" ON "SoftwareFeature"("featureId");

ALTER TABLE "Feature" ADD CONSTRAINT "Feature_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FeatureGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SoftwareFeature" ADD CONSTRAINT "SoftwareFeature_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SoftwareFeature" ADD CONSTRAINT "SoftwareFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;