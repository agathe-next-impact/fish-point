import { getCached } from '@/lib/redis';

const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export interface PollenData {
  /** Alder pollen grains/m³ */
  alderPollen: number;
  /** Birch pollen grains/m³ */
  birchPollen: number;
  /** Grass pollen grains/m³ */
  grassPollen: number;
  /** Total pollen level */
  totalPollen: number;
  /** Pollen intensity label */
  pollenLevel: 'none' | 'low' | 'moderate' | 'high';
  /** UV index from CAMS (more precise than standard Open-Meteo) */
  uvIndex: number;
  /** European AQI (1-5 scale) */
  europeanAqi: number | null;
  /** Human-readable label */
  label: string;
  /** Whether pollen suggests insect hatches (relevant for fly fishing) */
  insectHatchLikely: boolean;
}

function classifyPollen(total: number): PollenData['pollenLevel'] {
  if (total <= 0) return 'none';
  if (total < 20) return 'low';
  if (total < 80) return 'moderate';
  return 'high';
}

function pollenLabel(level: PollenData['pollenLevel'], insectHatch: boolean): string {
  const base = {
    none: 'Aucun pollen',
    low: 'Pollen faible',
    moderate: 'Pollen modéré',
    high: 'Pollen élevé',
  }[level];
  return insectHatch ? `${base} — éclosions d'insectes probables` : base;
}

/**
 * Fetch air quality and pollen data from Open-Meteo CAMS.
 * Pollen levels indicate insect hatches (ephemera, trichoptera)
 * which are excellent for fly fishing.
 * Cache: 1h.
 */
export async function fetchAirQualityData(
  lat: number,
  lon: number,
): Promise<PollenData | null> {
  const cacheKey = `airquality:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      latitude: lat.toFixed(2),
      longitude: lon.toFixed(2),
      current: 'uv_index,european_aqi,alder_pollen,birch_pollen,grass_pollen',
    });

    const res = await fetch(`${AIR_QUALITY_BASE}?${params}`);
    if (!res.ok) return null;

    const body = await res.json();
    const current = body.current;
    if (!current) return null;

    const alderPollen = current.alder_pollen ?? 0;
    const birchPollen = current.birch_pollen ?? 0;
    const grassPollen = current.grass_pollen ?? 0;
    const totalPollen = alderPollen + birchPollen + grassPollen;
    const uvIndex = current.uv_index ?? 0;
    const europeanAqi = current.european_aqi ?? null;

    const pollenLevel = classifyPollen(totalPollen);
    // High grass pollen in spring/summer correlates with aquatic insect hatches
    const insectHatchLikely = grassPollen >= 30 || totalPollen >= 50;

    return {
      alderPollen: Math.round(alderPollen),
      birchPollen: Math.round(birchPollen),
      grassPollen: Math.round(grassPollen),
      totalPollen: Math.round(totalPollen),
      pollenLevel,
      uvIndex: Math.round(uvIndex * 10) / 10,
      europeanAqi,
      label: pollenLabel(pollenLevel, insectHatchLikely),
      insectHatchLikely,
    };
  }, 3600); // 1 hour cache
}
