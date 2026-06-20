import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { buildSpotFilterSql } from '@/lib/spot-where-sql';
import { serializeSpotFilters, parseSpotFilterParams } from '@/lib/spot-filter-params';
import type { SpotListItem } from '@/types/spot';

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

type RawMapSpot = SpotListItem;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const north = parseFloat(searchParams.get('north') || '0');
    const south = parseFloat(searchParams.get('south') || '0');
    const east = parseFloat(searchParams.get('east') || '0');
    const west = parseFloat(searchParams.get('west') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '300'), 500);

    if (!north || !south || !east || !west) {
      return NextResponse.json({ error: 'north, south, east, west are required' }, { status: 400 });
    }

    const rounded = {
      north: roundCoord(north),
      south: roundCoord(south),
      east: roundCoord(east),
      west: roundCoord(west),
    };

    // Filtres « sortie » + « affichage » : MÊME source SQL que les tuiles MVT
    // (`buildSpotFilterSql`), alignée sur la liste (`buildSpotWhere`). Les couches
    // heatmap/fishability (qui consomment cette bbox) filtrent donc EXACTEMENT comme
    // les marqueurs et la liste — fin de la copie JS `MapContainer.filteredSpots`
    // (convergence carte ↔ liste, sous-étape 5).
    const filters = buildSpotFilterSql(searchParams);
    const filterSql = filters.length > 0
      ? Prisma.sql`AND ${Prisma.join(filters, ' AND ')}`
      : Prisma.empty;

    // La clé de cache DOIT inclure les filtres, sinon une zone identique sous deux jeux
    // de filtres distincts renverrait le même résultat. On réutilise la sérialisation
    // canonique (ordre stable, valeurs vides omises) après re-parse défensif (ignore les
    // valeurs arbitraires : seuls les filtres connus entrent dans la clé).
    const filterKey = serializeSpotFilters(parseSpotFilterParams(searchParams)).toString();
    const cacheKey = `spots:bbox:${rounded.north}:${rounded.south}:${rounded.east}:${rounded.west}:${limit}:${filterKey}`;

    const data = await getCached(cacheKey, async () => {
      const spots = await prisma.$queryRaw<RawMapSpot[]>(Prisma.sql`
        SELECT
          s."id",
          s."slug",
          s."name",
          s."latitude",
          s."longitude",
          s."department",
          s."commune",
          s."waterType",
          s."waterCategory",
          s."fishingTypes",
          s."averageRating",
          s."reviewCount",
          s."isPremium",
          s."isVerified",
          s."accessibility",
          s."fishabilityScore",
          s."dataOrigin",
          s."accessType",
          s."kind",
          s."parentId",
          img."url" AS "primaryImage"
        FROM "spots" s
        LEFT JOIN LATERAL (
          SELECT "url"
          FROM "spot_images"
          WHERE "spotId" = s."id" AND "isPrimary" = true
          LIMIT 1
        ) img ON true
        WHERE s."status" = ${'APPROVED'}::"SpotStatus"
          AND ST_Intersects(
            s."geometry",
            ST_MakeEnvelope(${rounded.west}, ${rounded.south}, ${rounded.east}, ${rounded.north}, 4326)::geography
          )
          ${filterSql}
        ORDER BY s."averageRating" DESC
        LIMIT ${limit}
      `);

      return spots;
    }, 120);

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('GET /api/spots/bbox error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
