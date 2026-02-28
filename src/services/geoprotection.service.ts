import { getCached } from '@/lib/redis';

const GEOPF_WFS_BASE = 'https://data.geopf.fr/wfs/ows';

export interface ProtectedZone {
  /** Zone type */
  type: 'natura2000_sic' | 'natura2000_zps' | 'nature_reserve' | 'biotope';
  /** Official zone name */
  name: string;
  /** Zone identifier */
  code: string;
  /** Human-readable type label */
  typeLabel: string;
}

export interface ProtectedZonesResult {
  zones: ProtectedZone[];
  /** Whether the spot is within any protected zone */
  isProtected: boolean;
  /** Whether Natura 2000 specifically */
  isNatura2000: boolean;
  /** Summary label */
  label: string;
}

interface WfsFeature {
  properties: Record<string, string | number | null>;
}

interface WfsResponse {
  features?: WfsFeature[];
}

/**
 * Query a WFS layer from data.geopf.fr for features near a point.
 * Uses a small bounding box (~500m) around the coordinates.
 */
async function queryWfsLayer(
  typeName: string,
  lat: number,
  lon: number,
  nameProperty: string,
  codeProperty: string,
): Promise<Array<{ name: string; code: string }>> {
  const delta = 0.005; // ~500m
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox: `${bbox},EPSG:4326`,
    count: '10',
  });

  const res = await fetch(`${GEOPF_WFS_BASE}?${params}`);
  if (!res.ok) return [];

  const body: WfsResponse = await res.json();
  if (!body.features || body.features.length === 0) return [];

  return body.features.map((f) => ({
    name: String(f.properties[nameProperty] ?? 'Zone protégée'),
    code: String(f.properties[codeProperty] ?? ''),
  }));
}

/**
 * Fetch all protected zones near a coordinate from Géoportail WFS.
 * Checks: Natura 2000 SIC, Natura 2000 ZPS, Réserves naturelles, Arrêtés de biotope.
 * Cache: 7 days (protected zones don't change often).
 */
export async function fetchProtectedZones(
  lat: number,
  lon: number,
): Promise<ProtectedZonesResult> {
  const cacheKey = `geoprotection:${lat.toFixed(4)}:${lon.toFixed(4)}`;

  return getCached(cacheKey, async () => {
    const zones: ProtectedZone[] = [];

    // Natura 2000 — Sites d'Importance Communautaire (Directive Habitats)
    try {
      const sic = await queryWfsLayer(
        'PROTECTEDAREAS.SIC:sic',
        lat, lon,
        'sitename', 'sitecode',
      );
      for (const s of sic) {
        zones.push({
          type: 'natura2000_sic',
          name: s.name,
          code: s.code,
          typeLabel: 'Natura 2000 — Directive Habitats',
        });
      }
    } catch { /* non-critical */ }

    // Natura 2000 — Zones de Protection Spéciale (Directive Oiseaux)
    try {
      const zps = await queryWfsLayer(
        'PROTECTEDAREAS.ZPS:zps',
        lat, lon,
        'sitename', 'sitecode',
      );
      for (const z of zps) {
        zones.push({
          type: 'natura2000_zps',
          name: z.name,
          code: z.code,
          typeLabel: 'Natura 2000 — Directive Oiseaux',
        });
      }
    } catch { /* non-critical */ }

    // Réserves naturelles nationales
    try {
      const reserves = await queryWfsLayer(
        'PROTECTEDAREAS.RN:rn',
        lat, lon,
        'nom', 'id_mnhn',
      );
      for (const r of reserves) {
        zones.push({
          type: 'nature_reserve',
          name: r.name,
          code: r.code,
          typeLabel: 'Réserve naturelle nationale',
        });
      }
    } catch { /* non-critical */ }

    // Arrêtés de protection de biotope
    try {
      const biotopes = await queryWfsLayer(
        'PROTECTEDAREAS.APB:apb',
        lat, lon,
        'nom', 'id_mnhn',
      );
      for (const b of biotopes) {
        zones.push({
          type: 'biotope',
          name: b.name,
          code: b.code,
          typeLabel: 'Arrêté de protection de biotope',
        });
      }
    } catch { /* non-critical */ }

    const isNatura2000 = zones.some((z) => z.type.startsWith('natura2000'));
    const isProtected = zones.length > 0;

    let label = 'Aucune zone protégée';
    if (zones.length === 1) {
      label = zones[0].typeLabel;
    } else if (zones.length > 1) {
      label = `${zones.length} zones protégées`;
    }

    return { zones, isProtected, isNatura2000, label };
  }, 604800); // 7 days cache
}
