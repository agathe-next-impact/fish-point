-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('FREE', 'FISHING_CARD', 'AAPPMA_SPECIFIC', 'PAID', 'MEMBERS_ONLY', 'RESTRICTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "spots" ADD COLUMN "accessType" "AccessType";
ALTER TABLE "spots" ADD COLUMN "accessDetails" JSONB;

-- CreateIndex
CREATE INDEX "spots_accessType_idx" ON "spots"("accessType");
