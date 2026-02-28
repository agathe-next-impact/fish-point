import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const north = parseFloat(searchParams.get('north') || '0');
    const south = parseFloat(searchParams.get('south') || '0');
    const east = parseFloat(searchParams.get('east') || '0');
    const west = parseFloat(searchParams.get('west') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000);

    if (!north || !south || !east || !west) {
      return NextResponse.json({ error: 'north, south, east, west are required' }, { status: 400 });
    }

    const spots = await prisma.spot.findMany({
      where: {
        status: 'APPROVED',
        latitude: { gte: south, lte: north },
        longitude: { gte: west, lte: east },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { averageRating: 'desc' },
      take: limit,
    });

    const data = spots.map((spot) => ({
      id: spot.id,
      slug: spot.slug,
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      department: spot.department,
      commune: spot.commune,
      waterType: spot.waterType,
      waterCategory: spot.waterCategory,
      fishingTypes: spot.fishingTypes,
      averageRating: spot.averageRating,
      reviewCount: spot.reviewCount,
      isPremium: spot.isPremium,
      isVerified: spot.isVerified,
      primaryImage: spot.images[0]?.url || null,
      fishabilityScore: spot.fishabilityScore,
      dataOrigin: spot.dataOrigin,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/spots/bbox error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
