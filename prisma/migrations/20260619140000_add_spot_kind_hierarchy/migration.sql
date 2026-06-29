-- Modèle 3 niveaux (chantier P1) : niveau de spot + hiérarchie plan d'eau ↔ zone d'accès.
-- Additif et idempotent. `kind NOT NULL DEFAULT 'WATER_BODY'` : sur PostgreSQL 11+ (Neon),
-- ajouter une colonne avec un défaut constant est une opération MÉTADONNÉE-SEULE (instantanée,
-- sans réécriture des ~50k lignes) → tous les spots existants deviennent WATER_BODY sans write massif.
-- Appliqué manuellement via `prisma db execute` (drift schéma↔migrations documenté → pas de migrate dev).

DO $$ BEGIN
  CREATE TYPE "SpotKind" AS ENUM ('WATER_BODY', 'ACCESS_ZONE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "spots" ADD COLUMN IF NOT EXISTS "kind" "SpotKind" NOT NULL DEFAULT 'WATER_BODY';
ALTER TABLE "spots" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

DO $$ BEGIN
  ALTER TABLE "spots"
    ADD CONSTRAINT "spots_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "spots"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "spots_kind_idx" ON "spots"("kind");
CREATE INDEX IF NOT EXISTS "spots_parentId_idx" ON "spots"("parentId");
CREATE INDEX IF NOT EXISTS "spots_status_kind_parentId_idx" ON "spots"("status", "kind", "parentId");
