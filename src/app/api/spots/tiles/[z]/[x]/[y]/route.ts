import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildSpotFilterSql } from '@/lib/spot-where-sql';

interface TileParams {
  z: string;
  x: string;
  y: string;
}

interface MvtRow {
  mvt: Uint8Array | Buffer | null;
}

function parseTileParam(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TileParams> },
) {
  try {
    const { z: zParam, x: xParam, y: yParam } = await params;
    const z = parseTileParam(zParam);
    const x = parseTileParam(xParam);
    const yWithExtension = yParam.replace(/\.mvt$/, '');
    const y = parseTileParam(yWithExtension);

    if (z == null || x == null || y == null || z < 0 || z > 16) {
      return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
    }

    const max = 2 ** z;
    if (x < 0 || x >= max || y < 0 || y >= max) {
      return NextResponse.json({ error: 'Tile out of range' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // Filtres « sortie » + « affichage » : source SQL UNIQUE partagée avec la bbox carte
    // (`buildSpotFilterSql`), elle-même alignée sur la liste (`buildSpotWhere`). La carte
    // (tuiles + bbox) et la liste appliquent donc exactement les mêmes filtres.
    const filters = buildSpotFilterSql(searchParams);

    const filterSql = filters.length > 0
      ? Prisma.sql`AND ${Prisma.join(filters, ' AND ')}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<MvtRow[]>(Prisma.sql`
      WITH bounds AS (
        SELECT ST_TileEnvelope(${z}, ${x}, ${y}) AS geom
      ),
      mvtgeom AS (
        SELECT
          ST_AsMVTGeom(
            ST_Transform(ST_SetSRID(ST_MakePoint(s."longitude", s."latitude"), 4326), 3857),
            bounds.geom,
            4096,
            64,
            true
          ) AS geom,
          s."id",
          s."slug",
          s."name",
          s."department",
          s."commune",
          s."waterType"::text AS "waterType",
          s."waterCategory"::text AS "waterCategory",
          array_to_string(s."fishingTypes"::text[], ',') AS "fishingTypes",
          s."averageRating",
          s."reviewCount",
          s."isPremium",
          s."isVerified",
          s."fishabilityScore",
          s."dataOrigin"::text AS "dataOrigin",
          s."accessType"::text AS "accessType",
          s."kind"::text AS "kind",
          s."parentId"
        FROM "spots" s, bounds
        WHERE s."status" = ${'APPROVED'}::"SpotStatus"
          AND ST_Intersects(s."geometry", ST_Transform(bounds.geom, 4326)::geography)
          ${filterSql}
        ORDER BY s."averageRating" DESC NULLS LAST
        LIMIT CASE
          WHEN ${z} < 7 THEN 500
          WHEN ${z} < 9 THEN 1500
          ELSE 5000
        END
      )
      SELECT ST_AsMVT(mvtgeom.*, 'spots', 4096, 'geom') AS mvt
      FROM mvtgeom
    `);

    const tile = rows[0]?.mvt ? Buffer.from(rows[0].mvt) : Buffer.alloc(0);

    return new NextResponse(tile, {
      headers: {
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('GET /api/spots/tiles/[z]/[x]/[y] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
