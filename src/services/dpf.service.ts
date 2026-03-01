import { getCached } from '@/lib/redis';

const SANDRE_DPF_WFS = 'https://services.sandre.eaufrance.fr/geo/dpf';

export interface DPFResult {
  isDPF: boolean;
  gestionnaire: string | null;
  toponyme: string | null;
  navigabilite: string | null;
}

interface WfsFeature {
  properties: Record<string, string | number | null>;
}

interface WfsResponse {
  features?: WfsFeature[];
}

/**
 * Check if a spot is located on a Domaine Public Fluvial (DPF) waterway.
 * DPF waterways require a fishing card (carte de pêche) managed by AAPPMA.
 *
 * Uses Sandre WFS with a ~200m BBOX around the point.
 * Cache: 7 days.
 */
export async function checkDPFStatus(
  lat: number,
  lon: number,
): Promise<DPFResult> {
  const cacheKey = `dpf:${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const delta = 0.002; // ~200m
        const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;

        const params = new URLSearchParams({
          SERVICE: 'WFS',
          VERSION: '2.0.0',
          REQUEST: 'GetFeature',
          typename: 'SegDPF',
          SRSNAME: 'EPSG:4326',
          OUTPUTFORMAT: 'application/json',
          BBOX: `${bbox},EPSG:4326`,
          count: '1',
        });

        const res = await fetch(`${SANDRE_DPF_WFS}?${params}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return { isDPF: false, gestionnaire: null, toponyme: null, navigabilite: null };

        const body: WfsResponse = await res.json();
        const feature = body.features?.[0];
        if (!feature?.properties) {
          return { isDPF: false, gestionnaire: null, toponyme: null, navigabilite: null };
        }

        return {
          isDPF: true,
          gestionnaire: String(feature.properties.Gestionnaire ?? '') || null,
          toponyme: String(feature.properties.Toponyme1 ?? '') || null,
          navigabilite: String(feature.properties.Navigabilite ?? '') || null,
        };
      } catch {
        return { isDPF: false, gestionnaire: null, toponyme: null, navigabilite: null };
      }
    },
    604800, // 7 days
  );
}
