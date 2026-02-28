import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { fetchWeatherByCoords } from '@/services/weather.service';
import { fetchAirQualityData } from '@/services/open-meteo-airquality.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> },
) {
  try {
    const { spotId } = await params;
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: { latitude: true, longitude: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Weather API not configured' }, { status: 503 });
    }

    const cacheKey = `weather:${spotId}`;
    const weather = await getCached(
      cacheKey,
      () => fetchWeatherByCoords(spot.latitude, spot.longitude, apiKey),
      600,
    );

    // Fetch air quality / pollen data (non-critical)
    let pollen = null;
    try {
      pollen = await fetchAirQualityData(spot.latitude, spot.longitude);
    } catch {
      // Non-critical
    }

    return NextResponse.json({ data: { ...weather, pollen } });
  } catch (error) {
    console.error('GET weather error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
