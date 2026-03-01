-- Delete all spots with waterType RESERVOIR and their related data
DELETE FROM "spot_species" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "spot_regulations" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "spot_images" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "reviews" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "favorites" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "catches" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "species_observations" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "water_quality_snapshots" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "biological_indices" WHERE "spotId" IN (SELECT "id" FROM "spots" WHERE "waterType" = 'RESERVOIR');
DELETE FROM "spots" WHERE "waterType" = 'RESERVOIR';

-- Remove RESERVOIR from WaterType enum
ALTER TYPE "WaterType" RENAME TO "WaterType_old";
CREATE TYPE "WaterType" AS ENUM ('RIVER', 'LAKE', 'POND', 'SEA', 'CANAL', 'STREAM');
ALTER TABLE "spots" ALTER COLUMN "waterType" TYPE "WaterType" USING "waterType"::text::"WaterType";
DROP TYPE "WaterType_old";
