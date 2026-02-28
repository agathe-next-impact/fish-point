import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user catches with relevant fields
    const catches = await prisma.catch.findMany({
      where: { userId },
      select: {
        id: true,
        caughtAt: true,
        bait: true,
        weight: true,
        length: true,
        technique: true,
        windSpeed: true,
        windDirection: true,
        cloudCover: true,
        humidity: true,
        weatherTemp: true,
        pressure: true,
        speciesId: true,
        species: { select: { name: true } },
      },
      orderBy: { caughtAt: 'asc' },
    });

    // Catches by hour of day
    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    for (const c of catches) {
      const hour = new Date(c.caughtAt).getHours();
      byHour[hour]++;
    }
    const catchesByHour = Object.entries(byHour).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));

    // Catches by bait
    const baitMap: Record<string, number> = {};
    for (const c of catches) {
      if (c.bait) {
        baitMap[c.bait] = (baitMap[c.bait] || 0) + 1;
      }
    }
    const catchesByBait = Object.entries(baitMap)
      .map(([bait, count]) => ({ bait, count }))
      .sort((a, b) => b.count - a.count);

    // Catches by species
    const speciesMap: Record<string, { name: string; count: number; totalWeight: number }> = {};
    for (const c of catches) {
      const key = c.speciesId;
      if (!speciesMap[key]) {
        speciesMap[key] = { name: c.species.name, count: 0, totalWeight: 0 };
      }
      speciesMap[key].count++;
      if (c.weight) speciesMap[key].totalWeight += c.weight;
    }
    const catchesBySpecies = Object.values(speciesMap)
      .sort((a, b) => b.count - a.count);

    // Catches by month (progression over time)
    const monthMap: Record<string, number> = {};
    for (const c of catches) {
      const d = new Date(c.caughtAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    }
    const catchesByMonth = Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Weather correlation
    const weatherCorrelation: {
      temperature: { range: string; count: number }[];
      windSpeed: { range: string; count: number }[];
      cloudCover: { range: string; count: number }[];
      pressure: { range: string; count: number }[];
    } = {
      temperature: [],
      windSpeed: [],
      cloudCover: [],
      pressure: [],
    };

    // Temperature ranges
    const tempRanges = [
      { label: '< 5°C', min: -Infinity, max: 5 },
      { label: '5-10°C', min: 5, max: 10 },
      { label: '10-15°C', min: 10, max: 15 },
      { label: '15-20°C', min: 15, max: 20 },
      { label: '20-25°C', min: 20, max: 25 },
      { label: '> 25°C', min: 25, max: Infinity },
    ];
    const tempCounts = tempRanges.map((r) => ({
      range: r.label,
      count: catches.filter(
        (c) => c.weatherTemp !== null && c.weatherTemp >= r.min && c.weatherTemp < r.max,
      ).length,
    }));
    weatherCorrelation.temperature = tempCounts;

    // Wind speed ranges (m/s)
    const windRanges = [
      { label: 'Calme (0-2)', min: 0, max: 2 },
      { label: 'Léger (2-5)', min: 2, max: 5 },
      { label: 'Modéré (5-10)', min: 5, max: 10 },
      { label: 'Fort (> 10)', min: 10, max: Infinity },
    ];
    const windCounts = windRanges.map((r) => ({
      range: r.label,
      count: catches.filter(
        (c) => c.windSpeed !== null && c.windSpeed >= r.min && c.windSpeed < r.max,
      ).length,
    }));
    weatherCorrelation.windSpeed = windCounts;

    // Cloud cover ranges (%)
    const cloudRanges = [
      { label: 'Dégagé (0-20%)', min: 0, max: 20 },
      { label: 'Partiellement (20-50%)', min: 20, max: 50 },
      { label: 'Nuageux (50-80%)', min: 50, max: 80 },
      { label: 'Couvert (80-100%)', min: 80, max: 101 },
    ];
    const cloudCounts = cloudRanges.map((r) => ({
      range: r.label,
      count: catches.filter(
        (c) => c.cloudCover !== null && c.cloudCover >= r.min && c.cloudCover < r.max,
      ).length,
    }));
    weatherCorrelation.cloudCover = cloudCounts;

    // Pressure ranges (hPa)
    const pressureRanges = [
      { label: 'Basse (< 1005)', min: 0, max: 1005 },
      { label: 'Normale (1005-1020)', min: 1005, max: 1020 },
      { label: 'Haute (> 1020)', min: 1020, max: Infinity },
    ];
    const pressureCounts = pressureRanges.map((r) => ({
      range: r.label,
      count: catches.filter(
        (c) => c.pressure !== null && c.pressure >= r.min && c.pressure < r.max,
      ).length,
    }));
    weatherCorrelation.pressure = pressureCounts;

    return NextResponse.json({
      data: {
        totalCatches: catches.length,
        catchesByHour,
        catchesByBait,
        catchesBySpecies,
        catchesByMonth,
        weatherCorrelation,
      },
    });
  } catch (error) {
    console.error('GET /api/catches/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
