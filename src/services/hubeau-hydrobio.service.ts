import { getCached } from '@/lib/redis';

const HUBEAU_BASE = process.env.HUBEAU_BASE_URL || 'https://hubeau.eaufrance.fr/api';

export interface HydrobioStation {
  code_station: string;
  libelle_station: string;
  distance_km: number;
}

export interface BiologicalIndexResult {
  indexType: string;
  value: number;
  qualityClass: string;
  measurementDate: string;
  stationCode: string;
}

/**
 * Find the nearest hydrobiological monitoring station.
 */
export async function findNearestHydrobioStation(
  lat: number,
  lon: number,
  distanceKm: number = 10,
): Promise<HydrobioStation | null> {
  const cacheKey = `hydrobio:station:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      distance: distanceKm.toString(),
      size: '1',
    });

    const res = await fetch(`${HUBEAU_BASE}/v1/hydrobio/stations_hydrobio?${params}`);
    if (!res.ok && res.status !== 206) {
      if (res.status === 404) return null;
      throw new Error(`Hub'Eau Hydrobio stations error: ${res.status}`);
    }

    const body = await res.json();
    const data = body.data ?? body;
    if (!Array.isArray(data) || data.length === 0) return null;

    const station = data[0];
    return {
      code_station: station.code_station_hydrobio ?? station.code_station,
      libelle_station: station.libelle_station ?? '',
      distance_km: station.distance ?? 0,
    };
  }, 86400); // 24h cache
}

/**
 * Map IBGN/IBD numeric value to quality class.
 */
function ibgnToQualityClass(value: number): string {
  if (value >= 17) return 'Très bon';
  if (value >= 13) return 'Bon';
  if (value >= 9) return 'Moyen';
  if (value >= 5) return 'Médiocre';
  return 'Mauvais';
}

function ibdToQualityClass(value: number): string {
  if (value >= 17) return 'Très bon';
  if (value >= 13) return 'Bon';
  if (value >= 9) return 'Moyen';
  if (value >= 5) return 'Médiocre';
  return 'Mauvais';
}

/**
 * Fetch biological indices (IBGN and IBD) for a station.
 * IBGN (code 5856) = invertebrate index
 * IBD (code 5910) = diatom index
 */
export async function fetchBiologicalIndices(
  stationCode: string,
): Promise<BiologicalIndexResult[]> {
  const cacheKey = `hydrobio:indices:${stationCode}`;

  return getCached(cacheKey, async () => {
    const results: BiologicalIndexResult[] = [];

    // Fetch indices for the station
    const params = new URLSearchParams({
      code_station_hydrobio: stationCode,
      size: '50',
      sort: 'desc',
    });

    const res = await fetch(`${HUBEAU_BASE}/v1/hydrobio/indices?${params}`);
    if (!res.ok && res.status !== 206) {
      return [];
    }

    const body = await res.json();
    const data = body.data ?? body;
    if (!Array.isArray(data)) return [];

    // Group by index type, keep most recent of each
    const seen = new Set<string>();

    for (const item of data) {
      const codeIndice = item.code_indice?.toString();
      const libelle = item.libelle_indice ?? '';
      const value = item.resultat_indice ?? item.resultat;

      if (value === null || value === undefined) continue;

      let indexType: string | null = null;
      let qualityClass: string;

      if (codeIndice === '5856' || libelle.includes('IBGN')) {
        indexType = 'IBGN';
        qualityClass = ibgnToQualityClass(value);
      } else if (codeIndice === '5910' || libelle.includes('IBD')) {
        indexType = 'IBD';
        qualityClass = ibdToQualityClass(value);
      } else {
        continue;
      }

      if (seen.has(indexType)) continue;
      seen.add(indexType);

      results.push({
        indexType,
        value,
        qualityClass,
        measurementDate: item.date_prelevement ?? item.date_operation ?? new Date().toISOString(),
        stationCode,
      });
    }

    return results;
  }, 86400); // 24h cache
}

/**
 * Get static score bonus from IBGN quality class.
 * Similar to IPR bonus in existing code.
 */
export function ibgnToStaticScoreBonus(qualityClass: string): number {
  switch (qualityClass) {
    case 'Très bon': return 15;
    case 'Bon': return 10;
    case 'Moyen': return 5;
    case 'Médiocre': return -5;
    case 'Mauvais': return -10;
    default: return 0;
  }
}
