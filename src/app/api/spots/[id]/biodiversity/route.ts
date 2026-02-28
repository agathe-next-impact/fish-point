import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchNearbyObservations } from '@/services/inaturalist.service';
import { fetchFishOccurrences } from '@/services/gbif.service';
import { getCached } from '@/lib/redis';

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

    const cacheKey = `biodiversity:${spot.id}`;
    const data = await getCached(cacheKey, async () => {
      const [inat, gbif] = await Promise.allSettled([
        fetchNearbyObservations(spot.latitude, spot.longitude),
        fetchFishOccurrences(spot.latitude, spot.longitude),
      ]);

      return {
        inaturalist: inat.status === 'fulfilled' ? inat.value : { fish: [], insects: [], birds: [], totalCount: 0 },
        gbif: gbif.status === 'fulfilled' ? gbif.value : [],
      };
    }, 86400); // 24h cache

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Biodiversity fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch biodiversity data' }, { status: 500 });
  }
}
