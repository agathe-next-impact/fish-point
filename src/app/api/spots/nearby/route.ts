import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '10000');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    // Use raw SQL with PostGIS
    const spots = await prisma.$queryRawUnsafe(`
      SELECT
        s.id, s.slug, s.name, s.latitude, s.longitude,
        s.department, s.commune, s."waterType", s."waterCategory",
        s."fishingTypes", s."averageRating", s."reviewCount",
        s."isPremium", s."isVerified", s."fishabilityScore", s."dataOrigin", s."accessType",
        ST_Distance(
          s.geometry,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM spots s
      WHERE s.status = 'APPROVED'
        AND ST_DWithin(
          s.geometry,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      ORDER BY distance ASC
      LIMIT $4
    `, lng, lat, radius, limit);

    return NextResponse.json({ data: spots });
  } catch (error) {
    console.error('GET /api/spots/nearby error:', error);
    // Fallback to non-spatial query if PostGIS not available
    try {
      const { searchParams } = new URL(request.url);
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lng = parseFloat(searchParams.get('lng') || '0');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

      const spots = await prisma.spot.findMany({
        where: { status: 'APPROVED' },
        take: limit,
        orderBy: { averageRating: 'desc' },
      });

      return NextResponse.json({ data: spots });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}
