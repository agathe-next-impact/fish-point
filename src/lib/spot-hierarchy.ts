/**
 * Rattachement d'une zone d'accès (ACCESS_ZONE) à son plan d'eau parent (modèle 3
 * niveaux). Source UNIQUE de la résolution `parentId`, partagée par les deux chemins de
 * création d'un accès : le formulaire (`POST /api/spots`) et l'ingestion OSM
 * (`osm-ingestion.service.ts`). Évite de dupliquer la requête PostGIS de proximité.
 *
 * Sécurité : valeurs paramétrées (`Prisma.sql`) — aucune interpolation brute.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type DbClient = Pick<typeof prisma, '$queryRaw'>;

/**
 * Renvoie l'id du plan d'eau (`kind = WATER_BODY`) APPROUVÉ le plus proche du point
 * donné, dans un rayon strict, ou `null` si aucun candidat (rattachement laissé vide —
 * réversible, jamais bloquant). Le seuil strict (défaut 300 m) évite les faux
 * rattachements ; au-delà, `parentId` reste NULL.
 *
 * NB géométrie : on réutilise exactement le motif PostGIS des routes tuiles/bbox
 * (`s."geometry"` comparé en `::geography`, distances en mètres).
 */
export async function resolveParentWaterBodyId(
  latitude: number,
  longitude: number,
  radiusMeters = 300,
  client: DbClient = prisma,
): Promise<string | null> {
  const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
  const rows = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT s."id"
    FROM "spots" s
    WHERE s."kind" = 'WATER_BODY'::"SpotKind"
      AND s."status" = 'APPROVED'::"SpotStatus"
      AND ST_DWithin(s."geometry", ${point}, ${radiusMeters})
    ORDER BY ST_Distance(s."geometry", ${point}) ASC
    LIMIT 1
  `);
  return rows[0]?.id ?? null;
}
