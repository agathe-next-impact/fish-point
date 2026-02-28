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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const spotId = searchParams.get('spotId');

    const where: Record<string, unknown> = { userId: session.user.id };
    if (spotId) where.spotId = spotId;
    if (startDate || endDate) {
      where.caughtAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const grouped = await prisma.catch.groupBy({
      by: ['speciesId'],
      where,
      _count: true,
      _avg: { weight: true, length: true },
      _max: { weight: true },
    });

    // Fetch species names
    const speciesIds = grouped.map((g) => g.speciesId);
    const species = await prisma.fishSpecies.findMany({
      where: { id: { in: speciesIds } },
      select: { id: true, name: true },
    });
    const speciesMap = new Map(species.map((s) => [s.id, s.name]));

    const data = grouped
      .map((g) => ({
        speciesId: g.speciesId,
        speciesName: speciesMap.get(g.speciesId) || 'Inconnu',
        count: g._count,
        avgWeight: g._avg.weight ? Math.round(g._avg.weight * 100) / 100 : null,
        maxWeight: g._max.weight,
        avgLength: g._avg.length ? Math.round(g._avg.length * 100) / 100 : null,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/dashboard/catches-by-species error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
