-- Ajout d'une note privée par spot enregistré (chantier P1 « Enregistrés + Collections », slice 4).
-- Additif, nullable, sans défaut → instantané sur PostgreSQL, non destructif.
-- `IF NOT EXISTS` rend la migration idempotente (sûre à rejouer ; appliquée manuellement
-- via `prisma db execute` sur la prod Neon le 2026-06-19 vu le drift schéma↔migrations
-- documenté dans docs/tech-debt.md, qui empêche un `prisma migrate dev` propre).
ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "note" TEXT;
