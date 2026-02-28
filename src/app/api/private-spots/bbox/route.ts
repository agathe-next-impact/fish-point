import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const north = parseFloat(searchParams.get('north') || '0');
    const south = parseFloat(searchParams.get('south') || '0');
    const east = parseFloat(searchParams.get('east') || '0');
    const west = parseFloat(searchParams.get('west') || '0');

    if (!north || !south || !east || !west) {
      return NextResponse.json({ error: 'north, south, east, west are required' }, { status: 400 });
    }

    const spots = await prisma.privateSpot.findMany({
      where: {
        userId: session.user.id,
        latitude: { gte: south, lte: north },
        longitude: { gte: west, lte: east },
      },
      include: {
        _count: { select: { visits: true } },
      },
    });

    const data = spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      color: spot.color,
      icon: spot.icon,
      tags: spot.tags,
      visitCount: spot._count.visits,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/private-spots/bbox error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
