-- Modèle 3 niveaux (slice 6) : rattachement UNIDIRECTIONNEL optionnel d'un waypoint privé
-- (private_spots, niveau 3) à son plan d'eau public (spots, niveau 1).
-- Additif, idempotent, rétro-compatible : spotId NULLABLE → les waypoints existants restent valides.
-- FK ON DELETE SET NULL : supprimer un plan d'eau public ne détruit jamais un waypoint privé.
-- Appliqué manuellement via `prisma db execute` (drift schéma↔migrations documenté → pas de migrate dev).

ALTER TABLE "private_spots" ADD COLUMN IF NOT EXISTS "spotId" TEXT;

DO $$ BEGIN
  ALTER TABLE "private_spots"
    ADD CONSTRAINT "private_spots_spotId_fkey"
    FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "private_spots_spotId_idx" ON "private_spots"("spotId");
