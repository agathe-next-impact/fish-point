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
    const speciesId = searchParams.get('speciesId');
    const spotId = searchParams.get('spotId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {
      userId: session.user.id,
      OR: [
        { bait: { not: null } },
        { lureType: { not: null } },
      ],
    };
    if (speciesId) where.speciesId = speciesId;
    if (spotId) where.spotId = spotId;
    if (startDate || endDate) {
      where.caughtAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const catches = await prisma.catch.findMany({
      where,
      select: { bait: true, lureType: true, weight: true },
    });

    // Group by bait (combining bait and lureType)
    const baitMap = new Map<string, { count: number; totalWeight: number; weightCount: number }>();

    for (const c of catches) {
      const baitName = c.bait || c.lureType || 'Inconnu';
      const entry = baitMap.get(baitName) || { count: 0, totalWeight: 0, weightCount: 0 };
      entry.count += 1;
      if (c.weight !== null) {
        entry.totalWeight += c.weight;
        entry.weightCount += 1;
      }
      baitMap.set(baitName, entry);
    }

    const data = Array.from(baitMap.entries())
      .map(([bait, stats]) => ({
        bait,
        count: stats.count,
        avgWeight: stats.weightCount > 0
          ? Math.round((stats.totalWeight / stats.weightCount) * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/dashboard/catches-by-bait error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
