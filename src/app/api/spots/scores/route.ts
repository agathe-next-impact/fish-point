import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
  }

  const ids = idsParam.split(',').slice(0, 100);
  const sortedIds = [...ids].sort().join(',');

  try {
    const cacheKey = `spots:scores:${sortedIds}`;
    const data = await getCached(cacheKey, async () => {
      const spots = await prisma.spot.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          fishabilityScore: true,
          staticScore: true,
          dynamicScore: true,
          scoreUpdatedAt: true,
        },
      });

      const result: Record<string, {
        fishabilityScore: number | null;
        staticScore: number | null;
        dynamicScore: number | null;
        scoreUpdatedAt: string | null;
      }> = {};

      for (const spot of spots) {
        result[spot.id] = {
          fishabilityScore: spot.fishabilityScore,
          staticScore: spot.staticScore,
          dynamicScore: spot.dynamicScore,
          scoreUpdatedAt: spot.scoreUpdatedAt?.toISOString() || null,
        };
      }

      return result;
    }, 300);

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Scores fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}
