import { getCached } from '@/lib/redis';

const GBIF_BASE = 'https://api.gbif.org/v1';

export interface GBIFSpeciesOccurrence {
  speciesName: string;
  scientificName: string;
  count: number;
  lastObserved: string | null;
}

/**
 * Fetch freshwater fish species occurrences from GBIF around a location.
 * taxonKey 204 = Actinopterygii (ray-finned fishes)
 */
export async function fetchFishOccurrences(
  lat: number,
  lon: number,
  radiusDeg: number = 0.05, // ~5km
): Promise<GBIFSpeciesOccurrence[]> {
  const cacheKey = `gbif:fish:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      decimalLatitude: `${(lat - radiusDeg).toFixed(4)},${(lat + radiusDeg).toFixed(4)}`,
      decimalLongitude: `${(lon - radiusDeg).toFixed(4)},${(lon + radiusDeg).toFixed(4)}`,
      taxonKey: '204', // Actinopterygii
      hasCoordinate: 'true',
      limit: '300',
    });

    const res = await fetch(`${GBIF_BASE}/occurrence/search?${params}`);
    if (!res.ok) {
      throw new Error(`GBIF error: ${res.status}`);
    }

    const body = await res.json();
    const results = body.results ?? [];

    // Aggregate by species
    const speciesMap = new Map<string, {
      scientificName: string;
      vernacularName: string;
      count: number;
      lastDate: string | null;
    }>();

    for (const occ of results) {
      const key = occ.species ?? occ.scientificName;
      if (!key) continue;

      const existing = speciesMap.get(key);
      if (existing) {
        existing.count++;
        if (occ.eventDate && (!existing.lastDate || occ.eventDate > existing.lastDate)) {
          existing.lastDate = occ.eventDate;
        }
      } else {
        speciesMap.set(key, {
          scientificName: key,
          vernacularName: occ.vernacularName ?? key,
          count: 1,
          lastDate: occ.eventDate ?? null,
        });
      }
    }

    return Array.from(speciesMap.values())
      .map((s) => ({
        speciesName: s.vernacularName,
        scientificName: s.scientificName,
        count: s.count,
        lastObserved: s.lastDate,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, 604800); // 7 days cache
}
