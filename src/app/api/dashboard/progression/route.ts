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
    const months = parseInt(searchParams.get('months') || '12');
    const spotId = searchParams.get('spotId');
    const speciesId = searchParams.get('speciesId');

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      userId: session.user.id,
      caughtAt: { gte: startDate },
    };
    if (spotId) where.spotId = spotId;
    if (speciesId) where.speciesId = speciesId;

    const catches = await prisma.catch.findMany({
      where,
      select: { caughtAt: true, weight: true },
      orderBy: { caughtAt: 'asc' },
    });

    // Group by month
    const monthMap = new Map<string, { count: number; totalWeight: number }>();

    // Initialize all months
    const cursor = new Date(startDate);
    const now = new Date();
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, { count: 0, totalWeight: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const c of catches) {
      const date = new Date(c.caughtAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key) || { count: 0, totalWeight: 0 };
      entry.count += 1;
      if (c.weight !== null) {
        entry.totalWeight += c.weight;
      }
      monthMap.set(key, entry);
    }

    const data = Array.from(monthMap.entries()).map(([month, stats]) => ({
      month,
      count: stats.count,
      totalWeight: Math.round(stats.totalWeight * 100) / 100,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/dashboard/progression error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
