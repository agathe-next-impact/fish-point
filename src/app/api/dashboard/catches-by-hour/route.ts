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

    const where: Record<string, unknown> = { userId: session.user.id };
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
      select: { caughtAt: true },
    });

    // Group by hour
    const hourCounts = new Map<number, number>();
    for (let h = 0; h < 24; h++) {
      hourCounts.set(h, 0);
    }

    for (const c of catches) {
      const hour = new Date(c.caughtAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const data = Array.from(hourCounts.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/dashboard/catches-by-hour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
