import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildApprovedSpotWhere, serializeSpotListItem, spotListSelect } from '@/server/spots';
import { nearbyQuerySchema } from '@/validators/spot.schema';
import { searchParamsToObject } from '@/lib/search-params';

function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = nearbyQuerySchema.safeParse(searchParamsToObject(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const query = validation.data;
    const latDelta = query.radius / 111320;
    const lngDelta = query.radius / (111320 * Math.max(Math.cos((query.lat * Math.PI) / 180), 0.01));
    const where = buildApprovedSpotWhere(query);

    where.latitude = { gte: query.lat - latDelta, lte: query.lat + latDelta };
    where.longitude = { gte: query.lng - lngDelta, lte: query.lng + lngDelta };

    const spots = await prisma.spot.findMany({
      where,
      select: spotListSelect,
      orderBy: { averageRating: 'desc' },
    });

    const data = spots
      .map((spot) => ({
        ...serializeSpotListItem(spot),
        distance: distanceInMeters(query.lat, query.lng, spot.latitude, spot.longitude),
      }))
      .filter((spot) => spot.distance <= query.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(query.offset, query.offset + query.limit);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/spots/nearby error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
