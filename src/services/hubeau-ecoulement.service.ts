import { getCached } from '@/lib/redis';
import type { HubeauPaginatedResponse } from '@/types/ingestion';

const HUBEAU_ECOULEMENT_BASE = 'https://hubeau.eaufrance.fr/api/v1/ecoulement';

export interface EcoulementStation {
  code_station: string;
  libelle_station: string;
  latitude: number;
  longitude: number;
  code_departement: string;
  libelle_cours_eau: string;
}

export interface EcoulementObservation {
  code_station: string;
  date_observation: string;
  code_ecoulement: string;
  libelle_ecoulement: string;
}

/**
 * Flow status codes from ONDE network:
 * - "1"  : Écoulement visible (flow visible)
 * - "1a" : Écoulement visible acceptable
 * - "1f" : Écoulement visible faible
 * - "2"  : Écoulement non visible (water present but no flow → hypoxia risk)
 * - "3"  : Assec (completely dry → no fishing possible)
 */
export type FlowStatus = 'flowing' | 'weak_flow' | 'stagnant' | 'dry' | 'unknown';

function parseFlowStatus(code: string): FlowStatus {
  if (code === '1' || code === '1a') return 'flowing';
  if (code === '1f') return 'weak_flow';
  if (code === '2') return 'stagnant';
  if (code === '3') return 'dry';
  return 'unknown';
}

/**
 * Scoring impact of flow status on fishability.
 * - flowing:    +10 (normal conditions)
 * - weak_flow:   0  (acceptable but not ideal)
 * - stagnant:  -15  (hypoxia risk, fish stressed)
 * - dry:       -50  (no fishing possible)
 */
export function getFlowScoreImpact(status: FlowStatus): number {
  switch (status) {
    case 'flowing': return 10;
    case 'weak_flow': return 0;
    case 'stagnant': return -15;
    case 'dry': return -50;
    default: return 0;
  }
}

/**
 * Find the nearest ONDE flow observation station.
 */
export async function findNearestEcoulementStation(
  lat: number,
  lon: number,
  maxDistanceKm = 15,
): Promise<EcoulementStation | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    distance: String(maxDistanceKm),
    size: '1',
    fields: 'code_station,libelle_station,latitude,longitude,code_departement,libelle_cours_eau',
  });

  const res = await fetch(`${HUBEAU_ECOULEMENT_BASE}/stations?${params}`);
  if (!res.ok && res.status !== 206) return null;

  const data: HubeauPaginatedResponse<EcoulementStation> = await res.json();
  return data.data?.[0] ?? null;
}

/**
 * Get the latest flow status for a station.
 * Cached for 6 hours (ONDE observations are updated monthly during campaign season).
 */
export async function getFlowStatus(
  stationCode: string,
): Promise<{ status: FlowStatus; label: string; date: string } | null> {
  const cacheKey = `flow_status:${stationCode}`;

  return getCached(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        code_station: stationCode,
        size: '1',
        sort: 'desc',
        fields: 'code_station,date_observation,code_ecoulement,libelle_ecoulement',
      });

      const res = await fetch(`${HUBEAU_ECOULEMENT_BASE}/observations?${params}`);
      if (!res.ok && res.status !== 206) return null;

      const data: HubeauPaginatedResponse<EcoulementObservation> = await res.json();
      if (!data.data || data.data.length === 0) return null;

      const obs = data.data[0];
      return {
        status: parseFlowStatus(obs.code_ecoulement),
        label: obs.libelle_ecoulement,
        date: obs.date_observation,
      };
    },
    21600, // 6 hours
  );
}

/**
 * Get flow status for coordinates (find nearest station, then latest observation).
 */
export async function getFlowStatusForCoords(
  lat: number,
  lon: number,
): Promise<{ status: FlowStatus; label: string; date: string; stationCode: string } | null> {
  const station = await findNearestEcoulementStation(lat, lon);
  if (!station) return null;

  const flow = await getFlowStatus(station.code_station);
  if (!flow) return null;

  return { ...flow, stationCode: station.code_station };
}
