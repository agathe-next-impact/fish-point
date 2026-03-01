-- AlterTable
ALTER TABLE "spots" ADD COLUMN     "confidenceDetails" JSONB,
ADD COLUMN     "confidenceScore" INTEGER,
ADD COLUMN     "osmTags" JSONB,
ADD COLUMN     "validatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "spots_confidenceScore_idx" ON "spots"("confidenceScore");
