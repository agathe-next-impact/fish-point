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
      weatherTemp: { not: null },
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
      select: {
        weatherTemp: true,
        pressure: true,
        windSpeed: true,
        cloudCover: true,
        weight: true,
        length: true,
        species: { select: { name: true } },
      },
    });

    const data = catches.map((c) => ({
      weatherTemp: c.weatherTemp,
      pressure: c.pressure,
      windSpeed: c.windSpeed,
      cloudCover: c.cloudCover,
      weight: c.weight,
      length: c.length,
      speciesName: c.species.name,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/dashboard/catches-by-weather error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
