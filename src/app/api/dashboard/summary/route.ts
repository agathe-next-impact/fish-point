import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function buildCatchWhere(userId: string, searchParams: URLSearchParams) {
  const speciesId = searchParams.get('speciesId');
  const spotId = searchParams.get('spotId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: Record<string, unknown> = { userId };
  if (speciesId) where.speciesId = speciesId;
  if (spotId) where.spotId = spotId;
  if (startDate || endDate) {
    where.caughtAt = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }
  return where;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const where = buildCatchWhere(session.user.id, searchParams);

    const catches = await prisma.catch.findMany({
      where,
      select: {
        caughtAt: true,
        bait: true,
        lureType: true,
        weight: true,
        length: true,
        weatherTemp: true,
        pressure: true,
        windSpeed: true,
        cloudCover: true,
        speciesId: true,
        species: { select: { name: true } },
      },
      orderBy: { caughtAt: 'asc' },
    });

    const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    const baitMap = new Map<string, { count: number; totalWeight: number; weightCount: number }>();
    const speciesMap = new Map<string, {
      speciesName: string;
      count: number;
      totalWeight: number;
      weightCount: number;
      maxWeight: number | null;
      totalLength: number;
      lengthCount: number;
    }>();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const progressionMap = new Map<string, { count: number; totalWeight: number }>();
    const cursor = new Date(startDate);
    const now = new Date();
    while (cursor <= now) {
      progressionMap.set(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`, {
        count: 0,
        totalWeight: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const weather = [];
    for (const catchRecord of catches) {
      byHour[catchRecord.caughtAt.getHours()].count += 1;

      const bait = catchRecord.bait || catchRecord.lureType || 'Inconnu';
      const baitStats = baitMap.get(bait) || { count: 0, totalWeight: 0, weightCount: 0 };
      baitStats.count += 1;
      if (catchRecord.weight !== null) {
        baitStats.totalWeight += catchRecord.weight;
        baitStats.weightCount += 1;
      }
      baitMap.set(bait, baitStats);

      const speciesStats = speciesMap.get(catchRecord.speciesId) || {
        speciesName: catchRecord.species.name,
        count: 0,
        totalWeight: 0,
        weightCount: 0,
        maxWeight: null,
        totalLength: 0,
        lengthCount: 0,
      };
      speciesStats.count += 1;
      if (catchRecord.weight !== null) {
        speciesStats.totalWeight += catchRecord.weight;
        speciesStats.weightCount += 1;
        speciesStats.maxWeight = Math.max(speciesStats.maxWeight ?? 0, catchRecord.weight);
      }
      if (catchRecord.length !== null) {
        speciesStats.totalLength += catchRecord.length;
        speciesStats.lengthCount += 1;
      }
      speciesMap.set(catchRecord.speciesId, speciesStats);

      if (catchRecord.weatherTemp !== null) {
        weather.push({
          weatherTemp: catchRecord.weatherTemp,
          pressure: catchRecord.pressure,
          windSpeed: catchRecord.windSpeed,
          cloudCover: catchRecord.cloudCover,
          weight: catchRecord.weight,
          length: catchRecord.length,
          speciesName: catchRecord.species.name,
        });
      }

      if (catchRecord.caughtAt >= startDate) {
        const key = `${catchRecord.caughtAt.getFullYear()}-${String(catchRecord.caughtAt.getMonth() + 1).padStart(2, '0')}`;
        const progression = progressionMap.get(key) || { count: 0, totalWeight: 0 };
        progression.count += 1;
        if (catchRecord.weight !== null) progression.totalWeight += catchRecord.weight;
        progressionMap.set(key, progression);
      }
    }

    const bait = Array.from(baitMap.entries())
      .map(([name, stats]) => ({
        bait: name,
        count: stats.count,
        avgWeight: stats.weightCount > 0 ? Math.round((stats.totalWeight / stats.weightCount) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const species = Array.from(speciesMap.entries())
      .map(([speciesId, stats]) => ({
        speciesId,
        speciesName: stats.speciesName,
        count: stats.count,
        avgWeight: stats.weightCount > 0 ? Math.round((stats.totalWeight / stats.weightCount) * 100) / 100 : null,
        maxWeight: stats.maxWeight,
        avgLength: stats.lengthCount > 0 ? Math.round((stats.totalLength / stats.lengthCount) * 100) / 100 : null,
      }))
      .sort((a, b) => b.count - a.count);

    const progression = Array.from(progressionMap.entries()).map(([month, stats]) => ({
      month,
      count: stats.count,
      totalWeight: Math.round(stats.totalWeight * 100) / 100,
    }));

    return NextResponse.json({
      data: {
        hour: byHour,
        bait,
        weather,
        species,
        progression,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('GET /api/dashboard/summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

