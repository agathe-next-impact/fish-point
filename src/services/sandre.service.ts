import type { SandreWaterBody } from '@/types/ingestion';
import { getCached } from '@/lib/redis';

const SANDRE_BASE = 'https://api.sandre.eaufrance.fr/referentiel/v1';

/**
 * Search for a water body (cours d'eau / plan d'eau) by name.
 * Uses Sandre referential API.
 */
export async function searchWaterBody(
  name: string,
): Promise<SandreWaterBody[]> {
  const cacheKey = `sandre:search:${name.toLowerCase().replace(/\s+/g, '_')}`;

  return getCached(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        outputSchema: 'SANDREv4',
        compress: 'false',
        NomEntiteHydrographique: name,
        size: '5',
      });

      const res = await fetch(`${SANDRE_BASE}/cea.json?${params}`);
      if (!res.ok) return [];

      const data = await res.json();
      const items = data?.REFERENTIEL?.CdEntiteHydr662 ?? data?.data ?? [];

      if (Array.isArray(items)) {
        return items.map((item: Record<string, string>) => ({
          CdEntiteHydr662: item.CdEntiteHydr662 || '',
          LbEntiteHydrographique: item.LbEntiteHydrographique || '',
          TypeEntiteHydro: item.TypeEntiteHydro || '',
          CdDepartement: item.CdDepartement,
        }));
      }

      return [];
    },
    86400, // 24h cache
  );
}

/**
 * Get details of a water body by its Sandre code.
 */
export async function getWaterBodyByCode(
  code: string,
): Promise<SandreWaterBody | null> {
  const cacheKey = `sandre:body:${code}`;

  return getCached(
    cacheKey,
    async () => {
      const res = await fetch(`${SANDRE_BASE}/cea/${code}.json?outputSchema=SANDREv4&compress=false`);
      if (!res.ok) return null;

      const data = await res.json();
      const item = data?.REFERENTIEL?.CdEntiteHydr662?.[0] ?? data;

      if (!item?.LbEntiteHydrographique) return null;

      return {
        CdEntiteHydr662: item.CdEntiteHydr662 || code,
        LbEntiteHydrographique: item.LbEntiteHydrographique,
        TypeEntiteHydro: item.TypeEntiteHydro || '',
        CdDepartement: item.CdDepartement,
      };
    },
    86400,
  );
}

/**
 * Enrich a spot's description using Sandre water body data.
 * If the spot has a linked `code_cours_eau` (from Hub'Eau), fetch the
 * official water body name and any available details.
 */
export async function enrichSpotFromSandre(
  spotId: string,
  waterBodyCode: string,
): Promise<boolean> {
  const waterBody = await getWaterBodyByCode(waterBodyCode);
  if (!waterBody) return false;

  const { prisma } = await import('@/lib/prisma');

  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { description: true, name: true },
  });

  if (!spot) return false;

  // Only enrich if description is empty or very short (auto-generated)
  if (spot.description && spot.description.length > 50) return false;

  const description = buildDescription(waterBody);
  if (!description) return false;

  await prisma.spot.update({
    where: { id: spotId },
    data: { description },
  });

  return true;
}

function buildDescription(waterBody: SandreWaterBody): string {
  const parts: string[] = [];

  if (waterBody.LbEntiteHydrographique) {
    const typeLabel = getWaterBodyTypeLabel(waterBody.TypeEntiteHydro);
    parts.push(
      `Station de pêche située sur ${typeLabel ? `${typeLabel} ` : ''}${waterBody.LbEntiteHydrographique}.`,
    );
  }

  parts.push(
    'Données issues du référentiel national des eaux de surface (Sandre/OFB).',
  );

  return parts.join(' ');
}

function getWaterBodyTypeLabel(type: string): string {
  switch (type) {
    case 'R':
      return 'la rivière';
    case 'F':
      return 'le fleuve';
    case 'C':
      return 'le canal';
    case 'L':
      return 'le lac';
    default:
      return '';
  }
}

/**
 * Batch enrich auto-discovered spots with Sandre data.
 */
export async function enrichAllSpotsFromSandre(options?: {
  departement?: string;
}): Promise<{ enriched: number }> {
  const { prisma } = await import('@/lib/prisma');

  const whereClause: Record<string, unknown> = {
    dataOrigin: { not: 'USER' },
    externalSource: 'hubeau_poisson',
    OR: [
      { description: null },
      { description: '' },
    ],
  };
  if (options?.departement) whereClause.department = options.departement;

  const spots = await prisma.spot.findMany({
    where: whereClause,
    select: { id: true, externalId: true },
  });

  let enriched = 0;

  for (const spot of spots) {
    if (!spot.externalId) continue;

    try {
      // externalId for Hub'Eau Poisson spots is the station code
      // We need to look up the station to get code_cours_eau
      const stationRes = await fetch(
        `https://hubeau.eaufrance.fr/api/v1/etat_piscicole/stations?code_station=${spot.externalId}&fields=code_cours_eau&size=1`,
      );

      if (!stationRes.ok) continue;

      const stationData = await stationRes.json();
      const waterBodyCode = stationData.data?.[0]?.code_cours_eau;
      if (!waterBodyCode) continue;

      const success = await enrichSpotFromSandre(spot.id, waterBodyCode);
      if (success) enriched++;
    } catch (error) {
      console.error(`Sandre enrichment failed for spot ${spot.id}:`, error);
    }
  }

  return { enriched };
}
