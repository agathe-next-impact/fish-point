import { getCached } from '@/lib/redis';

const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

export interface PressureDelta {
  /** Current pressure in hPa */
  current: number;
  /** Pressure 48h ago in hPa */
  past48h: number;
  /** Delta = current - past48h */
  delta: number;
  /** Human-readable trend */
  trend: 'chute_rapide' | 'chute_lente' | 'stable' | 'hausse_lente' | 'hausse_rapide';
  label: string;
}

/**
 * Fetch 48h pressure delta using Open-Meteo Archive API.
 * Calculates the difference between current pressure and pressure 48h ago.
 */
export async function fetchPressureDelta(
  lat: number,
  lon: number,
): Promise<PressureDelta | null> {
  const cacheKey = `pressure_delta:${lat.toFixed(1)}:${lon.toFixed(1)}`;

  return getCached(cacheKey, async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const params = new URLSearchParams({
      latitude: lat.toFixed(2),
      longitude: lon.toFixed(2),
      start_date: formatDate(past),
      end_date: formatDate(now),
      hourly: 'surface_pressure',
      timezone: 'Europe/Paris',
    });

    const res = await fetch(`${ARCHIVE_BASE}?${params}`);
    if (!res.ok) {
      throw new Error(`Open-Meteo Archive error: ${res.status}`);
    }

    const raw: {
      hourly: { time: string[]; surface_pressure: (number | null)[] };
    } = await res.json();

    const pressures = raw.hourly.surface_pressure;
    const times = raw.hourly.time;

    if (!pressures || pressures.length < 2) return null;

    // Get the most recent non-null pressure
    let currentPressure: number | null = null;
    for (let i = pressures.length - 1; i >= 0; i--) {
      if (pressures[i] !== null) {
        currentPressure = pressures[i]!;
        break;
      }
    }

    // Get pressure closest to 48h ago
    const targetTime = past.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    let pastPressure: number | null = null;
    for (let i = 0; i < times.length; i++) {
      if (times[i].startsWith(targetTime) && pressures[i] !== null) {
        pastPressure = pressures[i]!;
        break;
      }
    }

    // Fallback: use first available pressure as past
    if (pastPressure === null) {
      for (const p of pressures) {
        if (p !== null) {
          pastPressure = p;
          break;
        }
      }
    }

    if (currentPressure === null || pastPressure === null) return null;

    const delta = currentPressure - pastPressure;
    let trend: PressureDelta['trend'];
    let label: string;

    if (delta < -5) {
      trend = 'chute_rapide';
      label = `Chute rapide (${delta.toFixed(1)} hPa/48h)`;
    } else if (delta < -2) {
      trend = 'chute_lente';
      label = `En baisse (${delta.toFixed(1)} hPa/48h)`;
    } else if (delta <= 2) {
      trend = 'stable';
      label = `Stable (${delta.toFixed(1)} hPa/48h)`;
    } else if (delta <= 5) {
      trend = 'hausse_lente';
      label = `En hausse (${delta.toFixed(1)} hPa/48h)`;
    } else {
      trend = 'hausse_rapide';
      label = `Hausse rapide (+${delta.toFixed(1)} hPa/48h)`;
    }

    return { current: currentPressure, past48h: pastPressure, delta, trend, label };
  }, 7200); // 2h cache
}

/**
 * Get scoring impact from pressure delta.
 * Falling pressure = fish very active (pre-front).
 */
export function getPressureDeltaScoreImpact(trend: PressureDelta['trend']): number {
  switch (trend) {
    case 'chute_rapide': return 15;
    case 'chute_lente': return 10;
    case 'stable': return 5;
    case 'hausse_lente': return 0;
    case 'hausse_rapide': return -5;
  }
}
