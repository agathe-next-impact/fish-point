import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeDynamicScore } from '@/services/scoring.service';
import { fetchWeatherForCoords } from '@/services/open-meteo.service';
import { fetchWaterLevelByStation } from '@/services/water.service';
import { getFlowStatusForCoords } from '@/services/hubeau-ecoulement.service';
import { findTronconForStation } from '@/services/vigicrues.service';
import { getScoreLabel, getScoreColor } from '@/services/fish-index.service';
import { getCached } from '@/lib/redis';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        staticScore: true,
        dynamicScore: true,
        fishabilityScore: true,
        scoreUpdatedAt: true,
        hydroStationCode: true,
      },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    // Get fresh dynamic score with factors
    const cacheKey = `score:detail:${spot.id}`;
    const scoreDetail = await getCached(cacheKey, async () => {
      const weather = await fetchWeatherForCoords(spot.latitude, spot.longitude);

      let waterTrend: 'rising' | 'stable' | 'falling' | undefined;
      if (spot.hydroStationCode) {
        try {
          const waterData = await fetchWaterLevelByStation(spot.hydroStationCode);
          waterTrend = waterData?.trend;
        } catch {
          // Non-critical
        }
      }

      const dynamicScore = await computeDynamicScore(
        spot.id,
        spot.latitude,
        spot.longitude,
        weather,
        waterTrend,
      );

      const staticScore = spot.staticScore ?? 50;
      const fishabilityScore = Math.round(0.45 * staticScore + 0.55 * dynamicScore);

      // Gather extra factors for display
      const factors: Array<{ name: string; impact: 'positive' | 'neutral' | 'negative'; description: string }> = [];

      // Flow status
      try {
        const flow = await getFlowStatusForCoords(spot.latitude, spot.longitude);
        if (flow) {
          const impact = flow.status === 'flowing' ? 'positive' : flow.status === 'dry' ? 'negative' : 'neutral';
          factors.push({ name: 'Écoulement', impact, description: flow.label });
        }
      } catch { /* non-critical */ }

      // Vigicrues
      if (spot.hydroStationCode) {
        try {
          const alert = await findTronconForStation(spot.hydroStationCode);
          if (alert) {
            const impact = alert.level === 'green' ? 'positive' : alert.level === 'red' ? 'negative' : 'neutral';
            factors.push({ name: 'Vigilance crues', impact, description: `${alert.tronconName} — ${alert.level}` });
          }
        } catch { /* non-critical */ }
      }

      return {
        spotId: spot.id,
        fishabilityScore,
        static: staticScore,
        dynamic: dynamicScore,
        combined: fishabilityScore,
        label: getScoreLabel(fishabilityScore),
        color: getScoreColor(fishabilityScore),
        factors,
        weather: {
          temperature: weather.temperature,
          pressure: weather.pressure,
          windSpeed: weather.windSpeed,
          cloudCover: weather.cloudCover,
        },
        scoreUpdatedAt: new Date().toISOString(),
      };
    }, 300); // 5 minutes cache

    return NextResponse.json({ data: scoreDetail });
  } catch (error) {
    console.error('Score detail error:', error);
    return NextResponse.json({ error: 'Failed to compute score' }, { status: 500 });
  }
}
