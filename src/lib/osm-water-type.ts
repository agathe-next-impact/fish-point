import type { WaterType } from '@prisma/client';

/**
 * Déduit le `WaterType` d'un élément OSM depuis ses tags.
 *
 * Pur (aucun I/O) → testable sans booter le client Prisma. Extrait de
 * `osm-ingestion.service.ts` pour aligner avec `osm-kind.ts` (les tests unitaires
 * n'embarquent pas la chaîne DB).
 *
 * Note : l'enum `WaterType` n'a pas de valeur « accès » — une infrastructure d'accès
 * (jetée/cale/digue) hérite sémantiquement du type de son plan d'eau parent (résolu via
 * `parentId`). Ici on retombe sur LAKE par défaut, valeur cosmétique pour ces niveaux 2.
 * `reservoir` est mappé sur LAKE (la valeur enum `RESERVOIR` est en cours de retrait, cf.
 * drift schéma dans docs/tech-debt.md).
 */
export function inferWaterTypeFromTags(tags: Record<string, string>): WaterType {
  const water = tags.water || '';
  const natural = tags.natural || '';
  const landuse = tags.landuse || '';
  const waterway = tags.waterway || '';
  const leisure = tags.leisure || '';
  const manMade = tags.man_made || '';

  // Plans d'eau (polygones natural=water / landuse=reservoir)
  if (water === 'lake' || (natural === 'water' && !water)) return 'LAKE';
  if (water === 'pond' || water === 'basin') return 'POND';
  if (water === 'reservoir' || landuse === 'reservoir') return 'LAKE';
  if (water === 'river') return 'RIVER'; // (corrige un mapping river→CANAL hérité)
  if (water === 'canal') return 'CANAL';
  if (natural === 'coastline' || water === 'sea') return 'SEA';

  // Cours d'eau linéaires (tag waterway) — défensif : la capture linéaire en masse est
  // écartée (segments OSM trop fragmentés, cf. Tier 2), mais un point créé/édité côté
  // utilisateur peut porter ce tag et doit être typé correctement.
  if (waterway === 'river' || waterway === 'riverbank') return 'RIVER';
  if (waterway === 'canal') return 'CANAL';
  if (waterway === 'stream') return 'STREAM';

  // Zones de pêche / infrastructures d'accès sans type d'eau explicite — défaut LAKE
  // (le plan d'eau de pêche le plus courant en France).
  if (leisure === 'fishing' || tags.fishing === 'yes') return 'LAKE';
  if (manMade === 'pier' || manMade === 'breakwater' || leisure === 'slipway') return 'LAKE';

  return 'LAKE'; // défaut
}
