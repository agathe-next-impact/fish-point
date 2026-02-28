import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const spots = await prisma.spot.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { commune: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: limit,
      orderBy: { averageRating: 'desc' },
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
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/spots/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
