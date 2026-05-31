import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
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
    const cacheKey = `spots:bbox:${rounded.north}:${rounded.south}:${rounded.east}:${rounded.west}:${limit}`;

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
