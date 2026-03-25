-- Sync drift: pushToken column already exists in database but was missing from migrations
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;

-- Performance indexes: reviews
CREATE INDEX IF NOT EXISTS "reviews_spotId_idx" ON "reviews"("spotId");
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews"("userId");

-- Performance indexes: catches
CREATE INDEX IF NOT EXISTS "catches_speciesId_idx" ON "catches"("speciesId");
CREATE INDEX IF NOT EXISTS "catches_userId_spotId_idx" ON "catches"("userId", "spotId");

-- Performance indexes: favorites
CREATE INDEX IF NOT EXISTS "favorites_spotId_idx" ON "favorites"("spotId");
CREATE INDEX IF NOT EXISTS "favorites_userId_idx" ON "favorites"("userId");

-- Performance indexes: notifications
CREATE INDEX IF NOT EXISTS "notifications_userId_type_idx" ON "notifications"("userId", "type");

-- Performance indexes: shared_catches
CREATE INDEX IF NOT EXISTS "shared_catches_userId_idx" ON "shared_catches"("userId");

-- Performance indexes: shared_catch_likes
CREATE INDEX IF NOT EXISTS "shared_catch_likes_userId_idx" ON "shared_catch_likes"("userId");
