import { prisma } from '@/lib/prisma';
import type {
  HubeauQualityStation,
  HubeauQualityMeasurement,
  HubeauPaginatedResponse,
} from '@/types/ingestion';

const HUBEAU_QUALITE_BASE = 'https://hubeau.eaufrance.fr/api/v1/qualite_rivieres';
const PAGE_SIZE = 1000;
const DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hub'Eau quality parameter codes mapped to our internal names
const PARAMETER_MAP: Record<string, string> = {
  '1311': 'dissolved_oxygen',   // O2 dissous (mg/L)
  '1302': 'ph',                 // pH
  '1340': 'nitrates',           // Nitrates (mg/L)
  '1335': 'ammonium',           // Ammonium (mg/L)
  '1350': 'phosphates',         // Phosphates (mg/L)
  '1301': 'temperature',        // Température (°C)
};

/**
 * Find the nearest water quality station to a given point.
 * Uses Hub'Eau proximity search (max 15 km radius).
 */
export async function findNearestQualityStation(
  lat: number,
  lon: number,
  maxDistanceKm = 15,
): Promise<HubeauQualityStation | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    distance: String(maxDistanceKm),
    size: '1',
    fields: 'code_station,libelle_station,coordonnee_x,coordonnee_y,code_commune,libelle_commune',
  });

  const res = await fetch(`${HUBEAU_QUALITE_BASE}/station_pc?${params}`);
  if (!res.ok) return null;

  const data: HubeauPaginatedResponse<HubeauQualityStation> = await res.json();
  return data.data?.[0] ?? null;
}

/**
 * Fetch recent quality measurements for a station.
 * Filters for key fishing-relevant parameters only.
 */
export async function fetchQualityMeasurements(
  stationCode: string,
  params?: { size?: number; dateMin?: string },
): Promise<HubeauQualityMeasurement[]> {
  const parameterCodes = Object.keys(PARAMETER_MAP).join(',');

  const searchParams = new URLSearchParams({
    code_station: stationCode,
    code_parametre: parameterCodes,
    size: String(params?.size ?? 100),
    sort: 'desc',
    fields: 'code_station,code_parametre,libelle_parametre,resultat,symbole_unite,date_prelevement',
  });

  if (params?.dateMin) {
    searchParams.set('date_debut_prelevement', params.dateMin);
  }

  const res = await fetch(`${HUBEAU_QUALITE_BASE}/analyse_pc?${searchParams}`);
  if (!res.ok && res.status !== 206) {
    throw new Error(`Hub'Eau Qualité error: ${res.status} ${res.statusText}`);
  }

  const data: HubeauPaginatedResponse<HubeauQualityMeasurement> = await res.json();
  return data.data ?? [];
}

/**
 * Sync water quality data for a specific spot.
 * Finds the nearest quality station and stores the latest measurements.
 */
export async function syncQualityForSpot(spotId: string, lat: number, lon: number): Promise<number> {
  const station = await findNearestQualityStation(lat, lon);
  if (!station) return 0;

  // Fetch measurements from last 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const dateMin = twoYearsAgo.toISOString().split('T')[0];

  const measurements = await fetchQualityMeasurements(station.code_station, { dateMin });
  if (measurements.length === 0) return 0;

  // Keep only the latest measurement per parameter
  const latestByParam = new Map<string, HubeauQualityMeasurement>();
  for (const m of measurements) {
    const paramName = PARAMETER_MAP[m.code_parametre];
    if (!paramName) continue;

    const existing = latestByParam.get(paramName);
    if (!existing || m.date_prelevement > existing.date_prelevement) {
      latestByParam.set(paramName, m);
    }
  }

  let stored = 0;
  for (const [paramName, measurement] of latestByParam) {
    try {
      await prisma.waterQualitySnapshot.upsert({
        where: {
          spotId_parameter_measurementDate: {
            spotId,
            parameter: paramName,
            measurementDate: new Date(measurement.date_prelevement),
          },
        },
        update: {
          value: measurement.resultat,
          unit: measurement.symbole_unite,
          stationCode: station.code_station,
        },
        create: {
          spotId,
          parameter: paramName,
          value: measurement.resultat,
          unit: measurement.symbole_unite,
          measurementDate: new Date(measurement.date_prelevement),
          stationCode: station.code_station,
        },
      });
      stored++;
    } catch (error) {
      console.error(`Failed to store quality data for spot ${spotId}, param ${paramName}:`, error);
    }
  }

  return stored;
}

/**
 * Batch sync water quality for all auto-discovered spots.
 */
export async function syncQualityForAllSpots(options?: {
  departement?: string;
  batchSize?: number;
}): Promise<{ processed: number; measurements: number }> {
  const batchSize = options?.batchSize ?? 20;
  let totalProcessed = 0;
  let totalMeasurements = 0;

  const whereClause: Record<string, unknown> = {
    status: 'APPROVED',
    dataOrigin: { not: 'USER' },
  };
  if (options?.departement) whereClause.department = options.departement;

  const spots = await prisma.spot.findMany({
    where: whereClause,
    select: { id: true, latitude: true, longitude: true },
  });

  for (let i = 0; i < spots.length; i += batchSize) {
    const batch = spots.slice(i, i + batchSize);

    for (const spot of batch) {
      try {
        const count = await syncQualityForSpot(spot.id, spot.latitude, spot.longitude);
        totalMeasurements += count;
        totalProcessed++;
      } catch (error) {
        console.error(`Quality sync failed for spot ${spot.id}:`, error);
      }
    }

    // Rate limiting between batches
    if (i + batchSize < spots.length) {
      await delay(DELAY_MS);
    }
  }

  return { processed: totalProcessed, measurements: totalMeasurements };
}
