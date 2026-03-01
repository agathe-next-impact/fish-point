import { getCached } from '@/lib/redis';
import type { NearbyICPE } from '@/types/ingestion';

const GEORISQUES_BASE = 'https://www.georisques.gouv.fr/api/v1/installations_classees';

const LIVESTOCK_KEYWORDS = [
  'élevage',
  'elevage',
  'bovins',
  'porcins',
  'volailles',
  'porcherie',
  'poulailler',
  'lisier',
  'fumier',
  'engrais organique',
  'méthanisation',
  'methanisation',
];

/**
 * Check for nearby ICPE (classified installations) — especially livestock farms.
 * A livestock farm within 500m of a small water body is a strong indicator
 * that the "water body" may be a manure pit or agricultural lagoon.
 *
 * Cache: 24h.
 */
export async function findNearbyICPE(
  lat: number,
  lon: number,
  radiusMeters: number = 500,
): Promise<NearbyICPE> {
  const cacheKey = `georisques:${lat.toFixed(4)}_${lon.toFixed(4)}_${radiusMeters}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const params = new URLSearchParams({
          latlon: `${lat},${lon}`,
          rayon: String(radiusMeters),
          page: '1',
          page_size: '20',
        });

        const res = await fetch(`${GEORISQUES_BASE}?${params}`);
        if (!res.ok) return { hasLivestock: false, installations: [] };

        const body = await res.json();
        const items: Array<Record<string, unknown>> = body.data || [];

        const installations = items.map((item) => {
          const name = String(item.raisonSociale || item.nomInst || '');
          const regime = String(item.regime || '');
          const activites = Array.isArray(item.activites)
            ? (item.activites as Array<Record<string, unknown>>)
                .map((a) => String(a.nomActivite || ''))
                .join(' ')
            : '';
          const combinedText = `${name} ${activites}`.toLowerCase();
          const isLivestock = LIVESTOCK_KEYWORDS.some((kw) =>
            combinedText.includes(kw),
          );

          return { name, regime, isLivestock };
        });

        return {
          hasLivestock: installations.some((i) => i.isLivestock),
          installations,
        };
      } catch {
        return { hasLivestock: false, installations: [] };
      }
    },
    86400, // 24h
  );
}
