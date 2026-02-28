import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchProtectedZones } from '@/services/geoprotection.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const data = await fetchProtectedZones(spot.latitude, spot.longitude);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Protected zones error:', error);
    return NextResponse.json({ error: 'Failed to fetch protected zones' }, { status: 500 });
  }
}
