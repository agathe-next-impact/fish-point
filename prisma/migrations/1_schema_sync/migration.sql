-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('IDEAL_CONDITIONS', 'REGULATION_REMINDER', 'WATER_LEVEL_ABNORMAL', 'CUSTOM_SPOT_ACTIVITY');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'FISHING_CARD_EXPIRY';
ALTER TYPE "NotificationType" ADD VALUE 'SEASON_OPENING';
ALTER TYPE "NotificationType" ADD VALUE 'WATER_LEVEL_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_TRIP';
ALTER TYPE "NotificationType" ADD VALUE 'SHARED_CATCH_LIKE';
ALTER TYPE "NotificationType" ADD VALUE 'SHARED_CATCH_COMMENT';

-- AlterTable
ALTER TABLE "catches" ADD COLUMN     "catchLatitude" DOUBLE PRECISION,
ADD COLUMN     "catchLongitude" DOUBLE PRECISION,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "cloudCover" DOUBLE PRECISION,
ADD COLUMN     "hookSize" TEXT,
ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lineWeight" TEXT,
ADD COLUMN     "lureColor" TEXT,
ADD COLUMN     "lureSize" TEXT,
ADD COLUMN     "lureType" TEXT,
ADD COLUMN     "rigType" TEXT,
ADD COLUMN     "syncedAt" TIMESTAMP(3),
ADD COLUMN     "windDirection" DOUBLE PRECISION,
ADD COLUMN     "windSpeed" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "private_spots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "color" TEXT DEFAULT '#3b82f6',
    "icon" TEXT DEFAULT 'pin',
    "notes" TEXT,
    "tags" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_spot_visits" (
    "id" TEXT NOT NULL,
    "privateSpotId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "rating" INTEGER,
    "conditions" JSONB,

    CONSTRAINT "private_spot_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "spotId" TEXT,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fishing_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_trips" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "spotId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_catches" (
    "id" TEXT NOT NULL,
    "catchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blurLocation" BOOLEAN NOT NULL DEFAULT true,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_catches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_catch_likes" (
    "id" TEXT NOT NULL,
    "sharedCatchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_catch_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_catch_comments" (
    "id" TEXT NOT NULL,
    "sharedCatchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_catch_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardNumber" TEXT,
    "aappma" TEXT,
    "department" TEXT,
    "federation" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "hasReciprocity" BOOLEAN NOT NULL DEFAULT false,
    "reciprocityType" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishing_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "private_spots_userId_idx" ON "private_spots"("userId");

-- CreateIndex
CREATE INDEX "private_spot_visits_privateSpotId_idx" ON "private_spot_visits"("privateSpotId");

-- CreateIndex
CREATE INDEX "alert_subscriptions_userId_type_idx" ON "alert_subscriptions"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "fishing_groups_inviteCode_key" ON "fishing_groups"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_catches_catchId_key" ON "shared_catches"("catchId");

-- CreateIndex
CREATE INDEX "shared_catches_createdAt_idx" ON "shared_catches"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "shared_catch_likes_sharedCatchId_userId_key" ON "shared_catch_likes"("sharedCatchId", "userId");

-- CreateIndex
CREATE INDEX "fishing_cards_userId_idx" ON "fishing_cards"("userId");

-- CreateIndex
CREATE INDEX "fishing_cards_endDate_idx" ON "fishing_cards"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "catches_clientId_key" ON "catches"("clientId");

-- AddForeignKey
ALTER TABLE "private_spots" ADD CONSTRAINT "private_spots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_spot_visits" ADD CONSTRAINT "private_spot_visits_privateSpotId_fkey" FOREIGN KEY ("privateSpotId") REFERENCES "private_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fishing_groups" ADD CONSTRAINT "fishing_groups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "fishing_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_trips" ADD CONSTRAINT "group_trips_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "fishing_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_catches" ADD CONSTRAINT "shared_catches_catchId_fkey" FOREIGN KEY ("catchId") REFERENCES "catches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_catches" ADD CONSTRAINT "shared_catches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_catch_likes" ADD CONSTRAINT "shared_catch_likes_sharedCatchId_fkey" FOREIGN KEY ("sharedCatchId") REFERENCES "shared_catches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_catch_likes" ADD CONSTRAINT "shared_catch_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_catch_comments" ADD CONSTRAINT "shared_catch_comments_sharedCatchId_fkey" FOREIGN KEY ("sharedCatchId") REFERENCES "shared_catches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_catch_comments" ADD CONSTRAINT "shared_catch_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fishing_cards" ADD CONSTRAINT "fishing_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

