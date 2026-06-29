import type { SpotKind } from '@prisma/client';

/**
 * Modèle 3 niveaux : classe un élément OSM en zone d'accès (niveau 2) plutôt qu'en plan
 * d'eau (niveau 1) selon ses tags d'infrastructure d'accès (jetée, mise à l'eau, parking,
 * cale, point d'accès). Tout le reste (lac, étang, rivière, zone de pêche…) = WATER_BODY.
 *
 * Pur (aucun I/O) → testable sans booter le client Prisma. Extrait de
 * `osm-ingestion.service.ts` pour que les tests unitaires n'embarquent pas la chaîne DB.
 */
export function inferKindFromTags(tags: Record<string, string>): SpotKind {
  const manMade = tags.man_made || '';
  const leisure = tags.leisure || '';
  const amenity = tags.amenity || '';
  const waterway = tags.waterway || '';

  if (
    manMade === 'pier' ||
    manMade === 'breakwater' ||
    leisure === 'slipway' ||
    amenity === 'parking' ||
    amenity === 'boat_ramp' ||
    waterway === 'access_point'
  ) {
    return 'ACCESS_ZONE';
  }
  return 'WATER_BODY';
}
