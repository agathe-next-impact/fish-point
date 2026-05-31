-- Extensions used by search and spatial queries.
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Spatial generated column used by /api/spots/nearby.
ALTER TABLE "spots"
  ADD COLUMN IF NOT EXISTS "geometry" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED;

-- Common public spot list filters and sort orders.
CREATE INDEX IF NOT EXISTS "spots_status_rating_idx"
  ON "spots"("status", "averageRating" DESC);

CREATE INDEX IF NOT EXISTS "spots_status_department_rating_idx"
  ON "spots"("status", "department", "averageRating" DESC);

CREATE INDEX IF NOT EXISTS "spots_status_water_type_rating_idx"
  ON "spots"("status", "waterType", "averageRating" DESC);

CREATE INDEX IF NOT EXISTS "spots_status_fishability_idx"
  ON "spots"("status", "fishabilityScore" DESC);

CREATE INDEX IF NOT EXISTS "spots_status_lat_lng_idx"
  ON "spots"("status", "latitude", "longitude");

CREATE INDEX IF NOT EXISTS "spots_geometry_gist_idx"
  ON "spots" USING GIST ("geometry");

-- Trigram indexes accelerate ILIKE/contains searches.
CREATE INDEX IF NOT EXISTS "spots_name_trgm_idx"
  ON "spots" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "spots_commune_trgm_idx"
  ON "spots" USING GIN ("commune" gin_trgm_ops);

-- Primary image lookups are used by list/map/search endpoints.
CREATE INDEX IF NOT EXISTS "spot_images_spot_primary_idx"
  ON "spot_images"("spotId", "isPrimary");

-- Dashboard and feed filters.
CREATE INDEX IF NOT EXISTS "catches_user_caught_at_idx"
  ON "catches"("userId", "caughtAt" DESC);

CREATE INDEX IF NOT EXISTS "catches_user_species_caught_at_idx"
  ON "catches"("userId", "speciesId", "caughtAt" DESC);

CREATE INDEX IF NOT EXISTS "catches_user_spot_caught_at_idx"
  ON "catches"("userId", "spotId", "caughtAt" DESC);

