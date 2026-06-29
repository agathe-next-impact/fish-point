-- Avis structurés (chantier P1) : ajout du critère « précision des données » sur les avis.
-- Le modèle Review portait déjà accessibility / fishDensity / cleanliness / tranquility ;
-- seul ce critère manquait. Additif, nullable, sans défaut → instantané, non destructif.
-- `IF NOT EXISTS` = idempotent. Appliqué manuellement via `prisma db execute` sur la prod
-- Neon (drift schéma↔migrations documenté empêche un `prisma migrate dev` propre).
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "dataAccuracy" INTEGER;
