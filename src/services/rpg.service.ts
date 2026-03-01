import { getCached } from '@/lib/redis';
import type { RpgResult } from '@/types/ingestion';

const GEOPF_WFS_BASE = 'https://data.geopf.fr/wfs/ows';

interface WfsFeature {
  properties: Record<string, string | number | null>;
}

interface WfsResponse {
  features?: WfsFeature[];
}

/**
 * Check if coordinates fall within an agricultural parcel (RPG).
 * A fishing spot located inside a declared agricultural parcel is suspicious —
 * it may be an irrigation basin, manure lagoon, or other farm infrastructure.
 *
 * Uses a tight bbox (~50m) so the point must actually be within the parcel.
 * Cache: 7 days.
 */
export async function checkAgriculturalParcel(
  lat: number,
  lon: number,
): Promise<RpgResult> {
  const cacheKey = `rpg:${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const delta = 0.0005; // ~50m — tight check
        const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;

        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'RPG.LATEST:parcelles_graphiques',
          outputFormat: 'application/json',
          srsName: 'EPSG:4326',
          bbox: `${bbox},EPSG:4326`,
          count: '1',
        });

        const res = await fetch(`${GEOPF_WFS_BASE}?${params}`);
        if (!res.ok) return { isInParcel: false };

        const body: WfsResponse = await res.json();
        const feature = body.features?.[0];
        if (!feature?.properties) return { isInParcel: false };

        return {
          isInParcel: true,
          cultureCode: String(feature.properties.code_groupe_culture ?? '') || undefined,
          cultureLabel: String(feature.properties.libelle_groupe_culture ?? '') || undefined,
        };
      } catch {
        return { isInParcel: false };
      }
    },
    604800, // 7 days
  );
}
