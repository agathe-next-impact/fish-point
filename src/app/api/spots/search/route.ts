import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { searchRateLimit, checkRateLimit } from '@/lib/rate-limit';
import { spotListSelect, toSpotListItem } from '@/lib/spot-list-select';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const { limited, headers: rlHeaders } = await checkRateLimit(searchRateLimit, `search:${ip}`);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rlHeaders });
    }

    const cacheKey = `spots:search:${q.toLowerCase()}:${limit}`;
    const data = await getCached(cacheKey, async () => {
      const spots = await prisma.spot.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { commune: { contains: q, mode: 'insensitive' } },
            { department: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: spotListSelect,
        take: limit,
        orderBy: { averageRating: 'desc' },
      });

      return spots.map(toSpotListItem);
    }, 300);

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('GET /api/spots/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
