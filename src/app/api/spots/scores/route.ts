import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
  }

  const ids = idsParam.split(',').slice(0, 100); // Max 100 spots per request

  try {
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

    const data: Record<string, {
      fishabilityScore: number | null;
      staticScore: number | null;
      dynamicScore: number | null;
      scoreUpdatedAt: string | null;
    }> = {};

    for (const spot of spots) {
      data[spot.id] = {
        fishabilityScore: spot.fishabilityScore,
        staticScore: spot.staticScore,
        dynamicScore: spot.dynamicScore,
        scoreUpdatedAt: spot.scoreUpdatedAt?.toISOString() || null,
      };
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Scores fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}
