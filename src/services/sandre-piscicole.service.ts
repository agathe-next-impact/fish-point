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
        // SANDRE = MapServer. Trois pièges corrigés (diagnostic 2026-06-21) :
        //  1. outputFormat=application/json REFUSÉ pour cette couche (+ geojson OGR cassé
        //     côté serveur) → on lit le GML par défaut.
        //  2. CQL_FILTER (DWITHIN/BBOX) est une extension GeoServer IGNORÉE par MapServer
        //     (renvoyait le 1er feature quel que soit le point) → paramètre OGC `FILTER`
        //     (fes:Filter XML) sur la vraie colonne géométrie `msGeometry` (pas `geom`).
        //  3. CRS urn EPSG:4326 ⇒ ordre d'axes lat/lon (pas lon/lat).
        const filter =
          `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2">` +
          `<fes:Intersects><fes:ValueReference>msGeometry</fes:ValueReference>` +
          `<gml:Point srsName="urn:ogc:def:crs:EPSG::4326"><gml:pos>${lat} ${lon}</gml:pos></gml:Point>` +
          `</fes:Intersects></fes:Filter>`;
        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'sa:ContextePiscicole_FXX',
          count: '1',
          FILTER: filter,
        });

        const res = await fetch(`${SANDRE_WFS_BASE}?${params}`);
        if (!res.ok) return null;

        const xml = await res.text();
        const pick = (tag: string) =>
          xml.match(new RegExp(`<(?:\\w+:)?${tag}>([^<]+)</(?:\\w+:)?${tag}>`))?.[1]?.trim() ?? '';

        // CdCtxPisci porte le domaine en clair ("Salmonicole" / "Cyprinicole" / "Intermédiaire").
        const domaineRaw = pick('CdCtxPisci');
        if (!domaineRaw) return null;

        const domaine = parseDomaine(domaineRaw);
        const categorie = domaine === 'salmonicole' ? 'FIRST' : domaine === 'cyprinicole' ? 'SECOND' : null;

        return {
          code: pick('NumCtxPisci'),
          name: pick('NomCtxPisci'),
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
