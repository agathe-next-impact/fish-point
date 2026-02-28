import { getCached } from '@/lib/redis';

const HUBEAU_BASE = process.env.HUBEAU_BASE_URL || 'https://hubeau.eaufrance.fr/api';

export interface PiezoStation {
  code_bss: string;
  nom_commune: string;
  distance_km: number;
}

export interface PiezoLevel {
  code_bss: string;
  niveau_nappe: number;
  date_mesure: string;
  trend: 'rising' | 'stable' | 'falling';
  label: string;
}

/**
 * Find the nearest piezometric station within a given radius.
 */
export async function findNearestPiezoStation(
  lat: number,
  lon: number,
  distanceKm: number = 20,
): Promise<PiezoStation | null> {
  const cacheKey = `piezo:station:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      distance: (distanceKm * 1000).toString(), // API expects meters
      size: '1',
      sort: 'asc',
    });

    const res = await fetch(`${HUBEAU_BASE}/v1/niveaux_nappes/stations?${params}`);
    if (!res.ok && res.status !== 206) {
      if (res.status === 404) return null;
      throw new Error(`Hub'Eau Piézométrie stations error: ${res.status}`);
    }

    const body = await res.json();
    const data = body.data ?? body;
    if (!Array.isArray(data) || data.length === 0) return null;

    const station = data[0];
    return {
      code_bss: station.code_bss,
      nom_commune: station.nom_commune ?? '',
      distance_km: station.distance ? station.distance / 1000 : 0,
    };
  }, 86400); // 24h cache for station discovery
}

/**
 * Fetch the latest groundwater level for a station.
 * Also computes a trend by comparing with the previous measurement.
 */
export async function fetchPiezoLevel(codeBss: string): Promise<PiezoLevel | null> {
  const cacheKey = `piezo:level:${codeBss}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      code_bss: codeBss,
      size: '5',
      sort: 'desc',
    });

    const res = await fetch(`${HUBEAU_BASE}/v1/niveaux_nappes/chroniques_tr?${params}`);
    if (!res.ok && res.status !== 206) {
      if (res.status === 404) return null;
      throw new Error(`Hub'Eau Piézométrie chroniques error: ${res.status}`);
    }

    const body = await res.json();
    const data = body.data ?? body;
    if (!Array.isArray(data) || data.length === 0) return null;

    const latest = data[0];
    const level = latest.niveau_nappe_eau ?? latest.profondeur_nappe;
    if (level === undefined || level === null) return null;

    // Determine trend from recent measurements
    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (data.length >= 2) {
      const previous = data[1].niveau_nappe_eau ?? data[1].profondeur_nappe;
      if (previous !== null && previous !== undefined) {
        const diff = level - previous;
        if (diff > 0.1) trend = 'rising';
        else if (diff < -0.1) trend = 'falling';
      }
    }

    const trendLabels = {
      rising: 'En hausse',
      stable: 'Stable',
      falling: 'En baisse',
    };

    return {
      code_bss: codeBss,
      niveau_nappe: level,
      date_mesure: latest.date_mesure,
      trend,
      label: `${trendLabels[trend]} (${level.toFixed(2)} m)`,
    };
  }, 21600); // 6h cache
}
