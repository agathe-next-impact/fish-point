import type { OpenMeteoCurrentWeather, OpenMeteoRawResponse } from '@/types/ingestion';
import { getCached } from '@/lib/redis';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/meteofrance';
const GRID_RESOLUTION = 0.1; // ~10km grid cells

/**
 * Round coordinates to grid cell for weather data sharing.
 * Spots within the same ~10km cell share weather data.
 */
function toGridCell(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.round(lat / GRID_RESOLUTION) * GRID_RESOLUTION,
    lon: Math.round(lon / GRID_RESOLUTION) * GRID_RESOLUTION,
  };
}

function gridCacheKey(lat: number, lon: number): string {
  const cell = toGridCell(lat, lon);
  return `weather:grid:${cell.lat.toFixed(1)}:${cell.lon.toFixed(1)}`;
}

/**
 * Fetch current weather for a single location using AROME France model.
 * Results are cached by grid cell (25 min TTL).
 */
export async function fetchWeatherForCoords(
  lat: number,
  lon: number,
): Promise<OpenMeteoCurrentWeather> {
  const cell = toGridCell(lat, lon);
  const cacheKey = gridCacheKey(lat, lon);

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      latitude: cell.lat.toFixed(2),
      longitude: cell.lon.toFixed(2),
      current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,cloud_cover,weather_code',
      timezone: 'Europe/Paris',
    });

    const res = await fetch(`${OPEN_METEO_BASE}?${params}`);
    if (!res.ok) {
      throw new Error(`Open-Meteo error: ${res.status} ${res.statusText}`);
    }

    const raw: OpenMeteoRawResponse = await res.json();

    return {
      temperature: raw.current.temperature_2m,
      humidity: raw.current.relative_humidity_2m,
      pressure: raw.current.surface_pressure,
      windSpeed: raw.current.wind_speed_10m,
      cloudCover: raw.current.cloud_cover,
      weatherCode: raw.current.weather_code,
    };
  }, 1500); // 25 minutes TTL
}

/**
 * Batch fetch weather for multiple locations.
 * Groups by grid cell to minimize API calls.
 */
export async function fetchWeatherForBatch(
  coords: Array<{ id: string; lat: number; lon: number }>,
): Promise<Map<string, OpenMeteoCurrentWeather>> {
  const results = new Map<string, OpenMeteoCurrentWeather>();

  // Group spots by grid cell
  const cellGroups = new Map<string, Array<{ id: string; lat: number; lon: number }>>();
  for (const coord of coords) {
    const key = gridCacheKey(coord.lat, coord.lon);
    const group = cellGroups.get(key) || [];
    group.push(coord);
    cellGroups.set(key, group);
  }

  // Fetch weather per unique cell
  for (const [, spots] of cellGroups) {
    try {
      const first = spots[0];
      const weather = await fetchWeatherForCoords(first.lat, first.lon);
      // All spots in this cell share the same weather
      for (const spot of spots) {
        results.set(spot.id, weather);
      }
    } catch (error) {
      console.error(`Weather fetch failed for cell:`, error);
    }
  }

  return results;
}
