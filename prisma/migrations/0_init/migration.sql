-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "WaterType" AS ENUM ('RIVER', 'LAKE', 'POND', 'SEA', 'CANAL', 'RESERVOIR', 'STREAM');

-- CreateEnum
CREATE TYPE "WaterCategory" AS ENUM ('FIRST', 'SECOND');

-- CreateEnum
CREATE TYPE "FishingType" AS ENUM ('SPINNING', 'FLY', 'COARSE', 'CARP', 'SURFCASTING', 'TROLLING', 'FLOAT_TUBE', 'BOAT', 'SHORE');

-- CreateEnum
CREATE TYPE "FishCategory" AS ENUM ('CARNIVORE', 'SALMONID', 'CYPRINID', 'CATFISH', 'MARINE', 'CRUSTACEAN', 'OTHER');

-- CreateEnum
CREATE TYPE "SpotStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REPORTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Abundance" AS ENUM ('RARE', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "RegulationType" AS ENUM ('NO_KILL', 'CATCH_LIMIT', 'SIZE_LIMIT', 'SEASONAL_BAN', 'PERMANENT_BAN', 'NIGHT_BAN', 'RESERVE', 'POLLUTION_ALERT', 'DROUGHT_ALERT', 'FLOOD_ALERT', 'SPECIFIC_GEAR', 'WATER_RESTRICTION', 'NATURA_2000', 'FLOOD_FORECAST');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_SPOT_NEARBY', 'REGULATION_CHANGE', 'IDEAL_CONDITIONS', 'CATCH_LIKE', 'REVIEW_REPLY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DataOrigin" AS ENUM ('USER', 'AUTO_HUBEAU', 'AUTO_SANDRE', 'AUTO_OSM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "image" TEXT,
    "bio" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "stripeId" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "spots" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "department" TEXT NOT NULL,
    "commune" TEXT,
    "waterType" "WaterType" NOT NULL,
    "waterCategory" "WaterCategory",
    "fishingTypes" "FishingType"[],
    "accessibility" JSONB,
    "status" "SpotStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataOrigin" "DataOrigin" NOT NULL DEFAULT 'USER',
    "externalId" TEXT,
    "externalSource" TEXT,
    "staticScore" DOUBLE PRECISION,
    "dynamicScore" DOUBLE PRECISION,
    "fishabilityScore" DOUBLE PRECISION,
    "scoreUpdatedAt" TIMESTAMP(3),
    "hydroStationCode" TEXT,
    "tempStationCode" TEXT,
    "piezoStationCode" TEXT,
    "hydrobioStationCode" TEXT,
    "authorId" TEXT,

    CONSTRAINT "spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "spotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spot_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_species" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "abundance" "Abundance" NOT NULL DEFAULT 'MODERATE',

    CONSTRAINT "spot_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fish_species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "category" "FishCategory" NOT NULL,
    "minLegalSize" INTEGER,
    "imageUrl" TEXT,
    "maxLengthCm" DOUBLE PRECISION,
    "maxWeightKg" DOUBLE PRECISION,
    "optimalTempMin" DOUBLE PRECISION,
    "optimalTempMax" DOUBLE PRECISION,
    "feedingType" TEXT,
    "habitat" TEXT,
    "spawnMonthStart" INTEGER,
    "spawnMonthEnd" INTEGER,

    CONSTRAINT "fish_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catches" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "technique" TEXT,
    "bait" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "isReleased" BOOLEAN NOT NULL DEFAULT true,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weatherTemp" DOUBLE PRECISION,
    "weatherDesc" TEXT,
    "pressure" DOUBLE PRECISION,
    "moonPhase" TEXT,
    "waterTemp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,

    CONSTRAINT "catches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "fishDensity" INTEGER,
    "cleanliness" INTEGER,
    "tranquility" INTEGER,
    "accessibility" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "listName" TEXT NOT NULL DEFAULT 'default',
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_regulations" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "type" "RegulationType" NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spot_regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_observations" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "speciesCode" TEXT NOT NULL,
    "speciesName" TEXT NOT NULL,
    "scientificName" TEXT,
    "count" INTEGER,
    "averageWeight" DOUBLE PRECISION,
    "averageLength" DOUBLE PRECISION,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "sourceCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "species_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_quality_snapshots" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "stationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_quality_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biological_indices" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "indexType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "qualityClass" TEXT NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "stationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biological_indices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "spotsCreated" INTEGER NOT NULL DEFAULT 0,
    "spotsUpdated" INTEGER NOT NULL DEFAULT 0,
    "spotsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "ingestion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeId_key" ON "users"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "spots_slug_key" ON "spots"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "spots_externalId_key" ON "spots"("externalId");

-- CreateIndex
CREATE INDEX "spots_department_idx" ON "spots"("department");

-- CreateIndex
CREATE INDEX "spots_waterType_idx" ON "spots"("waterType");

-- CreateIndex
CREATE INDEX "spots_status_idx" ON "spots"("status");

-- CreateIndex
CREATE INDEX "spots_averageRating_idx" ON "spots"("averageRating" DESC);

-- CreateIndex
CREATE INDEX "spots_fishabilityScore_idx" ON "spots"("fishabilityScore" DESC);

-- CreateIndex
CREATE INDEX "spots_dataOrigin_idx" ON "spots"("dataOrigin");

-- CreateIndex
CREATE UNIQUE INDEX "spot_species_spotId_speciesId_key" ON "spot_species"("spotId", "speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "fish_species_name_key" ON "fish_species"("name");

-- CreateIndex
CREATE INDEX "catches_userId_idx" ON "catches"("userId");

-- CreateIndex
CREATE INDEX "catches_spotId_idx" ON "catches"("spotId");

-- CreateIndex
CREATE INDEX "catches_caughtAt_idx" ON "catches"("caughtAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_spotId_key" ON "reviews"("userId", "spotId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_spotId_listName_key" ON "favorites"("userId", "spotId", "listName");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "species_observations_spotId_idx" ON "species_observations"("spotId");

-- CreateIndex
CREATE INDEX "species_observations_speciesCode_idx" ON "species_observations"("speciesCode");

-- CreateIndex
CREATE UNIQUE INDEX "species_observations_spotId_speciesCode_observationDate_key" ON "species_observations"("spotId", "speciesCode", "observationDate");

-- CreateIndex
CREATE INDEX "water_quality_snapshots_spotId_idx" ON "water_quality_snapshots"("spotId");

-- CreateIndex
CREATE UNIQUE INDEX "water_quality_snapshots_spotId_parameter_measurementDate_key" ON "water_quality_snapshots"("spotId", "parameter", "measurementDate");

-- CreateIndex
CREATE INDEX "biological_indices_spotId_idx" ON "biological_indices"("spotId");

-- CreateIndex
CREATE UNIQUE INDEX "biological_indices_spotId_indexType_measurementDate_key" ON "biological_indices"("spotId", "indexType", "measurementDate");

-- CreateIndex
CREATE INDEX "ingestion_logs_source_startedAt_idx" ON "ingestion_logs"("source", "startedAt" DESC);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spots" ADD CONSTRAINT "spots_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_images" ADD CONSTRAINT "spot_images_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_species" ADD CONSTRAINT "spot_species_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_species" ADD CONSTRAINT "spot_species_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "fish_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catches" ADD CONSTRAINT "catches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catches" ADD CONSTRAINT "catches_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catches" ADD CONSTRAINT "catches_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "fish_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_regulations" ADD CONSTRAINT "spot_regulations_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_observations" ADD CONSTRAINT "species_observations_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_quality_snapshots" ADD CONSTRAINT "water_quality_snapshots_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biological_indices" ADD CONSTRAINT "biological_indices_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

