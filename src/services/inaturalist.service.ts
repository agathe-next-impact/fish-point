import { getCached } from '@/lib/redis';

const INATURALIST_BASE = 'https://api.inaturalist.org/v1';

export interface INatObservation {
  id: number;
  speciesName: string;
  scientificName: string;
  iconicTaxon: string;
  imageUrl: string | null;
  observedOn: string;
  qualityGrade: string;
}

export interface BiodiversitySummary {
  fish: INatObservation[];
  insects: INatObservation[];
  birds: INatObservation[];
  totalCount: number;
}

/**
 * Fetch research-grade observations from iNaturalist around a location.
 * Focuses on fish (Actinopterygii), aquatic insects (Insecta), and piscivorous birds (Aves).
 */
export async function fetchNearbyObservations(
  lat: number,
  lon: number,
  radiusKm: number = 5,
): Promise<BiodiversitySummary> {
  const cacheKey = `inat:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const results: BiodiversitySummary = {
      fish: [],
      insects: [],
      birds: [],
      totalCount: 0,
    };

    // Fetch fish + insects + birds in separate queries for better targeting
    const taxa = [
      { key: 'fish' as const, taxon_id: '47178', iconic: 'Actinopterygii' },
      { key: 'insects' as const, taxon_id: '47158', iconic: 'Insecta' },
      { key: 'birds' as const, taxon_id: '3', iconic: 'Aves' },
    ];

    for (const { key, taxon_id } of taxa) {
      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lng: lon.toString(),
          radius: radiusKm.toString(),
          quality_grade: 'research',
          taxon_id,
          per_page: '20',
          order_by: 'observed_on',
          order: 'desc',
          locale: 'fr',
        });

        const res = await fetch(`${INATURALIST_BASE}/observations?${params}`, {
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) continue;

        const body = await res.json();
        const observations = body.results ?? [];

        // Deduplicate by species
        const seenSpecies = new Set<string>();

        for (const obs of observations) {
          const taxon = obs.taxon;
          if (!taxon?.name) continue;

          if (seenSpecies.has(taxon.name)) continue;
          seenSpecies.add(taxon.name);

          const entry: INatObservation = {
            id: obs.id,
            speciesName: taxon.preferred_common_name ?? taxon.name,
            scientificName: taxon.name,
            iconicTaxon: taxon.iconic_taxon_name ?? key,
            imageUrl: obs.photos?.[0]?.url?.replace('square', 'small') ?? null,
            observedOn: obs.observed_on ?? '',
            qualityGrade: obs.quality_grade ?? 'research',
          };

          results[key].push(entry);
        }
      } catch {
        // Non-critical - continue with other taxa
      }
    }

    results.totalCount = results.fish.length + results.insects.length + results.birds.length;
    return results;
  }, 86400); // 24h cache
}
