import { getCached } from '@/lib/redis';

const FLOOD_API_BASE = 'https://flood-api.open-meteo.com/v1/flood';

export interface FloodForecast {
  /** Current river discharge in m³/s */
  currentDischarge: number;
  /** Maximum forecasted discharge over the next 7 days in m³/s */
  maxForecastDischarge: number;
  /** Mean discharge over the forecast period */
  meanDischarge: number;
  /** Day of maximum forecasted discharge (ISO date) */
  peakDate: string;
  /** Risk level based on discharge ratio to mean */
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  /** Human-readable label */
  label: string;
}

/**
 * Determine flood risk level based on ratio of max forecast to mean discharge.
 * Thresholds inspired by GloFAS return periods.
 */
function classifyRisk(maxDischarge: number, meanDischarge: number): FloodForecast['riskLevel'] {
  if (meanDischarge <= 0) return 'low';
  const ratio = maxDischarge / meanDischarge;
  if (ratio >= 5) return 'extreme';
  if (ratio >= 3) return 'high';
  if (ratio >= 1.5) return 'moderate';
  return 'low';
}

function riskLabel(level: FloodForecast['riskLevel']): string {
  switch (level) {
    case 'extreme': return 'Crue majeure prévue';
    case 'high': return 'Risque de crue élevé';
    case 'moderate': return 'Débit en hausse';
    case 'low': return 'Débit normal';
  }
}

/**
 * Get score impact from flood risk level.
 * High/extreme discharge makes fishing dangerous and fish scattered.
 */
export function getFloodScoreImpact(level: FloodForecast['riskLevel']): number {
  switch (level) {
    case 'extreme': return -30;
    case 'high': return -15;
    case 'moderate': return -5;
    case 'low': return 0;
  }
}

/**
 * Fetch 7-day flood forecast from Open-Meteo GloFAS API.
 * Returns discharge data and risk classification.
 * Cache: 3h (GloFAS updates every 6-12h).
 */
export async function fetchFloodForecast(
  lat: number,
  lon: number,
): Promise<FloodForecast | null> {
  const cacheKey = `flood:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      latitude: lat.toFixed(2),
      longitude: lon.toFixed(2),
      daily: 'river_discharge',
      forecast_days: '7',
    });

    const res = await fetch(`${FLOOD_API_BASE}?${params}`);
    if (!res.ok) return null;

    const body = await res.json();
    const daily = body.daily;
    if (!daily?.river_discharge || daily.river_discharge.length === 0) return null;

    const discharges: number[] = daily.river_discharge.filter((v: number | null) => v !== null);
    if (discharges.length === 0) return null;

    const dates: string[] = daily.time ?? [];
    const currentDischarge = discharges[0];
    const maxForecastDischarge = Math.max(...discharges);
    const meanDischarge = discharges.reduce((a: number, b: number) => a + b, 0) / discharges.length;

    const peakIndex = discharges.indexOf(maxForecastDischarge);
    const peakDate = dates[peakIndex] ?? dates[0] ?? new Date().toISOString().slice(0, 10);

    const riskLevel = classifyRisk(maxForecastDischarge, meanDischarge);

    return {
      currentDischarge: Math.round(currentDischarge * 10) / 10,
      maxForecastDischarge: Math.round(maxForecastDischarge * 10) / 10,
      meanDischarge: Math.round(meanDischarge * 10) / 10,
      peakDate,
      riskLevel,
      label: riskLabel(riskLevel),
    };
  }, 10800); // 3 hours cache
}
