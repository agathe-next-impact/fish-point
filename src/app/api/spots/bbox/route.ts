import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { spotListSelect, toSpotListItem } from '@/lib/spot-list-select';

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

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
      const spots = await prisma.spot.findMany({
        where: {
          status: 'APPROVED',
          latitude: { gte: rounded.south, lte: rounded.north },
          longitude: { gte: rounded.west, lte: rounded.east },
        },
        select: spotListSelect,
        orderBy: { averageRating: 'desc' },
        take: limit,
      });

      return spots.map(toSpotListItem);
    }, 120);

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('GET /api/spots/bbox error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
