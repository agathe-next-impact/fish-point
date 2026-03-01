import { getCached } from '@/lib/redis';
import type { BdTopoWaterBody } from '@/types/ingestion';

const GEOPF_WFS_BASE = 'https://data.geopf.fr/wfs/ows';

const FISHING_FRIENDLY_NATURES = [
  'Lac',
  'Retenue',
  'Retenue-barrage',
  'Réservoir-bassin piscicole',
  'Étang',
  'Gravière',
  'Lac naturel',
];

const NEGATIVE_NATURES = [
  "Réservoir-bassin d'orage",
  'Plan d\'eau de mine',
  'Bassin portuaire',
  'Réservoir industriel',
  'Station de traitement',
];

export function isFishingFriendlyNature(nature: string): boolean {
  return FISHING_FRIENDLY_NATURES.some(
    (n) => nature.toLowerCase().includes(n.toLowerCase()),
  );
}

export function isNegativeNature(nature: string): boolean {
  return NEGATIVE_NATURES.some(
    (n) => nature.toLowerCase().includes(n.toLowerCase()),
  );
}

interface WfsFeature {
  properties: Record<string, string | number | null>;
}

interface WfsResponse {
  features?: WfsFeature[];
}

/**
 * Query a BD TOPO WFS layer for a water body near a point.
 * Uses a small bounding box (~300m) around the coordinates.
 */
async function queryBdTopoLayer(
  typeName: string,
  lat: number,
  lon: number,
): Promise<{ nature: string; nom: string } | null> {
  const delta = 0.003; // ~300m
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox: `${bbox},EPSG:4326`,
    count: '1',
  });

  try {
    const res = await fetch(`${GEOPF_WFS_BASE}?${params}`);
    if (!res.ok) return null;

    const body: WfsResponse = await res.json();
    const feature = body.features?.[0];
    if (!feature?.properties) return null;

    return {
      nature: String(feature.properties.nature ?? ''),
      nom: String(feature.properties.nom ?? ''),
    };
  } catch {
    return null;
  }
}

/**
 * Find a water body at the given coordinates in IGN BD TOPO.
 * Checks plan_d_eau first (standing water), then surface_hydrographique.
 * Cache: 7 days (topographic data is very stable).
 */
export async function findWaterBody(
  lat: number,
  lon: number,
): Promise<BdTopoWaterBody> {
  const cacheKey = `bdtopo:${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return getCached(
    cacheKey,
    async () => {
      // Try plan_d_eau first (standing water — most relevant for fishing)
      const planDeau = await queryBdTopoLayer('BDTOPO_V3:plan_d_eau', lat, lon);
      if (planDeau) {
        return {
          found: true,
          nature: planDeau.nature,
          name: planDeau.nom || null,
          layer: 'plan_d_eau' as const,
        };
      }

      // Fall back to surface_hydrographique (all hydro surfaces)
      const surfaceHydro = await queryBdTopoLayer(
        'BDTOPO_V3:surface_hydrographique',
        lat,
        lon,
      );
      if (surfaceHydro) {
        return {
          found: true,
          nature: surfaceHydro.nature,
          name: surfaceHydro.nom || null,
          layer: 'surface_hydrographique' as const,
        };
      }

      return { found: false, nature: null, name: null, layer: null };
    },
    604800, // 7 days
  );
}
