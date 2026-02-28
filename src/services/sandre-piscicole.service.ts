import { getCached } from '@/lib/redis';

const SANDRE_WFS_BASE = 'https://services.sandre.eaufrance.fr/geo/sandre';

export interface ContextePiscicole {
  code: string;
  name: string;
  domaine: 'salmonicole' | 'cyprinicole' | 'intermediaire' | 'unknown';
  categorie: 'FIRST' | 'SECOND' | null;
}

/**
 * Query Sandre WFS for the "Contexte Piscicole" at a given point.
 * Returns the regulatory fish category (1st/2nd) and domain (salmonid/cyprinid).
 *
 * Uses a DWITHIN filter to find the nearest context within 1km.
 */
export async function getContextePiscicole(
  lat: number,
  lon: number,
): Promise<ContextePiscicole | null> {
  const cacheKey = `piscicole:${lat.toFixed(3)}_${lon.toFixed(3)}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        // WFS GetFeature request with spatial filter
        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'sa:ContextePiscicole_FXX',
          outputFormat: 'application/json',
          count: '1',
          CQL_FILTER: `DWITHIN(geom,POINT(${lon} ${lat}),1,kilometers)`,
        });

        const res = await fetch(`${SANDRE_WFS_BASE}?${params}`);
        if (!res.ok) return null;

        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature?.properties) return null;

        const props = feature.properties;

        // Determine domain from properties
        const domaine = parseDomaine(
          props.LbContextePiscicole || props.NomContextePiscicole || '',
        );

        // Determine category from domain
        const categorie = domaine === 'salmonicole' ? 'FIRST' : domaine === 'cyprinicole' ? 'SECOND' : null;

        return {
          code: props.CdContextePiscicole || props.gml_id || '',
          name: props.LbContextePiscicole || props.NomContextePiscicole || '',
          domaine,
          categorie,
        };
      } catch {
        return null;
      }
    },
    86400, // 24h cache (regulatory data doesn't change often)
  );
}

function parseDomaine(name: string): ContextePiscicole['domaine'] {
  const lower = name.toLowerCase();
  if (lower.includes('salmo')) return 'salmonicole';
  if (lower.includes('cypri')) return 'cyprinicole';
  if (lower.includes('inter') || lower.includes('mixt')) return 'intermediaire';
  return 'unknown';
}

/**
 * Update the water category of a spot based on Sandre regulatory data.
 * Returns the determined category, or null if unavailable.
 */
export async function resolveWaterCategory(
  lat: number,
  lon: number,
): Promise<{ categorie: 'FIRST' | 'SECOND' | null; domaine: string } | null> {
  const ctx = await getContextePiscicole(lat, lon);
  if (!ctx) return null;

  return {
    categorie: ctx.categorie,
    domaine: ctx.domaine,
  };
}

/**
 * Batch update water categories for spots using Sandre WFS.
 */
export async function updateCategoriesFromSandre(
  spots: Array<{ id: string; latitude: number; longitude: number }>,
): Promise<number> {
  const { prisma } = await import('@/lib/prisma');
  let updated = 0;

  for (const spot of spots) {
    try {
      const result = await resolveWaterCategory(spot.latitude, spot.longitude);
      if (result?.categorie) {
        await prisma.spot.update({
          where: { id: spot.id },
          data: { waterCategory: result.categorie },
        });
        updated++;
      }
    } catch {
      // Non-critical
    }
  }

  return updated;
}
