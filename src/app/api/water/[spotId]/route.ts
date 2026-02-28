import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { findNearestStation, fetchWaterLevelByStation } from '@/services/water.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> },
) {
  try {
    const { spotId } = await params;
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: { latitude: true, longitude: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const cacheKey = `water:${spotId}`;
    const waterLevel = await getCached(
      cacheKey,
      async () => {
        const stationCode = await findNearestStation(spot.latitude, spot.longitude);
        if (!stationCode) return null;
        return fetchWaterLevelByStation(stationCode);
      },
      900,
    );

    return NextResponse.json({ data: waterLevel });
  } catch (error) {
    console.error('GET water level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
