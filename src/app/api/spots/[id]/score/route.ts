import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeDynamicScore } from '@/services/scoring.service';
import { fetchWeatherForCoords } from '@/services/open-meteo.service';
import { fetchWaterLevelByStation } from '@/services/water.service';
import { fetchWaterTemperature } from '@/services/hubeau-temperature.service';
import { getFlowStatusForCoords } from '@/services/hubeau-ecoulement.service';
import { findTronconForStation } from '@/services/vigicrues.service';
import { fetchDroughtRestriction } from '@/services/vigieau.service';
import { fetchPressureDelta } from '@/services/open-meteo-historical.service';
import { computeSolunarData } from '@/services/solunar.service';
import { fetchPiezoLevel } from '@/services/hubeau-piezometrie.service';
import { fetchFloodForecast } from '@/services/open-meteo-flood.service';
import { fetchAirQualityData } from '@/services/open-meteo-airquality.service';
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
        tempStationCode: true,
        piezoStationCode: true,
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

      // VigiEau drought restrictions (go/no-go)
      try {
        const drought = await fetchDroughtRestriction(spot.latitude, spot.longitude);
        if (drought) {
          const impact = drought.fishingImpacted ? 'negative' : 'neutral';
          factors.push({ name: 'Sécheresse', impact, description: drought.label });
        }
      } catch { /* non-critical */ }

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

      // 48h pressure delta (replaces simple pressure reading)
      try {
        const delta = await fetchPressureDelta(spot.latitude, spot.longitude);
        if (delta) {
          const impact = delta.delta < -2 ? 'positive' : delta.delta > 5 ? 'negative' : 'neutral';
          factors.push({ name: 'Tendance baro', impact, description: delta.label });
        }
      } catch { /* non-critical */ }

      // Current pressure
      const pressure = weather.pressure;
      if (pressure >= 1015 && pressure <= 1025) {
        factors.push({ name: 'Pression', impact: 'positive', description: `${pressure.toFixed(0)} hPa — haute pression` });
      } else if (pressure < 1005) {
        factors.push({ name: 'Pression', impact: 'negative', description: `${pressure.toFixed(0)} hPa — dépression` });
      } else {
        factors.push({ name: 'Pression', impact: 'neutral', description: `${pressure.toFixed(0)} hPa` });
      }

      // Wind
      if (weather.windSpeed < 15) {
        factors.push({ name: 'Vent', impact: 'positive', description: `${weather.windSpeed} km/h — calme` });
      } else if (weather.windSpeed > 30) {
        factors.push({ name: 'Vent', impact: 'negative', description: `${weather.windSpeed} km/h — fort` });
      } else {
        factors.push({ name: 'Vent', impact: 'neutral', description: `${weather.windSpeed} km/h` });
      }

      // UV index
      if (weather.uvIndex !== undefined) {
        const uvImpact = weather.uvIndex < 3 ? 'positive' : weather.uvIndex > 6 ? 'negative' : 'neutral';
        const uvDesc = weather.uvIndex < 3 ? 'Faible — poissons actifs' : weather.uvIndex > 6 ? 'Fort — poissons en profondeur' : 'Modéré';
        factors.push({ name: 'UV', impact: uvImpact, description: `${weather.uvIndex.toFixed(1)} — ${uvDesc}` });
      }

      // Precipitation
      if (weather.precipitation !== undefined && weather.precipitation > 0) {
        const precImpact = weather.precipitation <= 2 ? 'positive' : weather.precipitation > 5 ? 'negative' : 'neutral';
        factors.push({ name: 'Précipitations', impact: precImpact, description: `${weather.precipitation.toFixed(1)} mm/h` });
      } else if (weather.precipitationProbability !== undefined && weather.precipitationProbability > 70) {
        factors.push({ name: 'Précipitations', impact: 'neutral', description: `${weather.precipitationProbability}% probable` });
      }

      // Solunar (replaces simple moon phase)
      const solunar = computeSolunarData(new Date(), spot.latitude, spot.longitude);
      if (solunar.currentActivity === 'major') {
        factors.push({ name: 'Solunaire', impact: 'positive', description: `${solunar.moonPhaseName} — période majeure` });
      } else if (solunar.currentActivity === 'minor') {
        factors.push({ name: 'Solunaire', impact: 'positive', description: `${solunar.moonPhaseName} — période mineure` });
      } else {
        factors.push({ name: 'Solunaire', impact: 'neutral', description: solunar.moonPhaseName });
      }

      // Piezometric level (informational)
      if (spot.piezoStationCode) {
        try {
          const piezo = await fetchPiezoLevel(spot.piezoStationCode);
          if (piezo) {
            const impact = piezo.trend === 'rising' ? 'positive' : piezo.trend === 'falling' ? 'negative' : 'neutral';
            factors.push({ name: 'Nappe', impact, description: piezo.label });
          }
        } catch { /* non-critical */ }
      }

      // Water temperature
      if (spot.tempStationCode) {
        try {
          const tempData = await fetchWaterTemperature(spot.tempStationCode);
          if (tempData) {
            const t = tempData.temperature;
            const impact = (t >= 12 && t <= 22) ? 'positive' : (t < 4 || t > 30) ? 'negative' : 'neutral';
            factors.push({ name: 'Temp. eau', impact, description: `${t.toFixed(1)}°C` });
          }
        } catch { /* non-critical */ }
      }

      // GloFAS flood forecast (7-day)
      try {
        const flood = await fetchFloodForecast(spot.latitude, spot.longitude);
        if (flood && flood.riskLevel !== 'low') {
          const impact = flood.riskLevel === 'extreme' || flood.riskLevel === 'high' ? 'negative' : 'neutral';
          factors.push({ name: 'Prévision crues', impact, description: flood.label });
        }
      } catch { /* non-critical */ }

      // Air quality / pollen (insect hatch indicator)
      try {
        const airQuality = await fetchAirQualityData(spot.latitude, spot.longitude);
        if (airQuality && airQuality.insectHatchLikely) {
          factors.push({ name: 'Pollen', impact: 'positive', description: airQuality.label });
        }
      } catch { /* non-critical */ }

      return {
        spotId: spot.id,
        fishabilityScore,
        staticScore,
        dynamicScore,
        label: getScoreLabel(fishabilityScore),
        color: getScoreColor(fishabilityScore),
        factors,
        weather: {
          temperature: weather.temperature,
          pressure: weather.pressure,
          windSpeed: weather.windSpeed,
          cloudCover: weather.cloudCover,
          uvIndex: weather.uvIndex,
          precipitation: weather.precipitation,
          precipitationProbability: weather.precipitationProbability,
        },
        solunar: {
          moonPhaseName: solunar.moonPhaseName,
          currentActivity: solunar.currentActivity,
          periods: solunar.periods.map((p) => ({
            type: p.type,
            label: p.label,
            start: p.start.toISOString(),
            end: p.end.toISOString(),
          })),
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
