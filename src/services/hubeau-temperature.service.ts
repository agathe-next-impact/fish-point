import { getCached } from '@/lib/redis';
import type {
  HubeauTempStation,
  HubeauTempMeasurement,
  HubeauPaginatedResponse,
} from '@/types/ingestion';

const HUBEAU_TEMP_BASE = 'https://hubeau.eaufrance.fr/api/v1/temperature';

/**
 * Find the nearest temperature monitoring station.
 */
export async function findNearestTempStation(
  lat: number,
  lon: number,
  maxDistanceKm = 20,
): Promise<HubeauTempStation | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    distance: String(maxDistanceKm),
    size: '1',
    fields: 'code_station,libelle_station,coordonnee_x,coordonnee_y,code_departement',
  });

  const res = await fetch(`${HUBEAU_TEMP_BASE}/station?${params}`);
  if (!res.ok) return null;

  const data: HubeauPaginatedResponse<HubeauTempStation> = await res.json();
  return data.data?.[0] ?? null;
}

/**
 * Fetch the latest water temperature for a station.
 * Cached for 30 minutes.
 */
export async function fetchWaterTemperature(
  stationCode: string,
): Promise<{ temperature: number; date: string } | null> {
  const cacheKey = `water_temp:${stationCode}`;

  return getCached(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        code_station: stationCode,
        size: '1',
        sort: 'desc',
        fields: 'code_station,date_mesure_temp,resultat',
      });

      const res = await fetch(`${HUBEAU_TEMP_BASE}/chronique?${params}`);
      if (!res.ok) return null;

      const data: HubeauPaginatedResponse<HubeauTempMeasurement> = await res.json();
      if (!data.data || data.data.length === 0) return null;

      return {
        temperature: data.data[0].resultat,
        date: data.data[0].date_mesure_temp,
      };
    },
    1800, // 30 min
  );
}

/**
 * Get water temperature for coordinates.
 * Finds the nearest station and returns the latest reading.
 */
export async function getWaterTemperatureForCoords(
  lat: number,
  lon: number,
): Promise<{ temperature: number; date: string; stationCode: string } | null> {
  const station = await findNearestTempStation(lat, lon);
  if (!station) return null;

  const temp = await fetchWaterTemperature(station.code_station);
  if (!temp) return null;

  return {
    ...temp,
    stationCode: station.code_station,
  };
}

/**
 * Link spots to their nearest temperature stations.
 * Stores the station code on the spot for future quick lookups.
 */
export async function linkTempStationsToSpots(
  spots: Array<{ id: string; latitude: number; longitude: number }>,
): Promise<number> {
  let linked = 0;

  for (const spot of spots) {
    try {
      const station = await findNearestTempStation(spot.latitude, spot.longitude);
      if (station) {
        const { prisma } = await import('@/lib/prisma');
        await prisma.spot.update({
          where: { id: spot.id },
          data: { tempStationCode: station.code_station },
        });
        linked++;
      }
    } catch (error) {
      console.error(`Failed to link temp station for spot ${spot.id}:`, error);
    }
  }

  return linked;
}
