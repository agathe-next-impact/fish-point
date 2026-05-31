import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { spotListSelect, toSpotListItem } from '@/lib/spot-list-select';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const spot = await prisma.spot.findFirst({
      where: {
        status: 'APPROVED',
        OR: [{ id }, { slug: id }],
      },
      select: spotListSelect,
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    return NextResponse.json(
      { data: toSpotListItem(spot) },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800' } },
    );
  } catch (error) {
    console.error('GET /api/spots/map-preview/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
