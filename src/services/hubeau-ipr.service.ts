import { getCached } from '@/lib/redis';
import type { HubeauPaginatedResponse } from '@/types/ingestion';

const HUBEAU_POISSON_BASE = 'https://hubeau.eaufrance.fr/api/v1/etat_piscicole';

export interface IPRIndicator {
  code_station: string;
  date_operation: string;
  ipr_note: number | null;
  ipr_code_classe: string | null;
  ipr_libelle_classe: string | null;
}

/**
 * IPR (Indice Poisson Rivière) classes:
 * 1 = Excellent, 2 = Bon, 3 = Médiocre, 4 = Mauvais, 5 = Très mauvais
 *
 * Score interpretation:
 * - Lower IPR = better ecological condition
 * - < 7: Excellent
 * - 7-16: Bon
 * - 16-25: Médiocre
 * - 25-36: Mauvais
 * - > 36: Très mauvais
 */
export function iprToStaticScoreBonus(iprNote: number | null, iprClasse: string | null): number {
  if (iprNote == null && iprClasse == null) return 0;

  // Use class if available (more reliable)
  if (iprClasse) {
    switch (iprClasse) {
      case '1': return 20;  // Excellent → big boost
      case '2': return 10;  // Bon → moderate boost
      case '3': return 0;   // Médiocre → neutral
      case '4': return -10; // Mauvais → penalty
      case '5': return -20; // Très mauvais → big penalty
    }
  }

  // Fallback to score interpretation
  if (iprNote != null) {
    if (iprNote < 7) return 20;
    if (iprNote < 16) return 10;
    if (iprNote < 25) return 0;
    if (iprNote < 36) return -10;
    return -20;
  }

  return 0;
}

/**
 * Fetch the latest IPR indicator for a station.
 * Cached for 24 hours (IPR doesn't change frequently).
 */
export async function fetchIPRForStation(
  stationCode: string,
): Promise<IPRIndicator | null> {
  // Hub'Eau station codes for poisson have a different format
  // than our externalId prefix. Strip prefix if present.
  const cleanCode = stationCode.replace('hubeau_poisson_', '');
  const cacheKey = `ipr:${cleanCode}`;

  return getCached(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        code_station: cleanCode,
        size: '1',
        sort: 'desc',
        fields: 'code_station,date_operation,ipr_note,ipr_code_classe,ipr_libelle_classe',
      });

      const res = await fetch(`${HUBEAU_POISSON_BASE}/indicateurs?${params}`);
      if (!res.ok && res.status !== 206) return null;

      const data: HubeauPaginatedResponse<IPRIndicator> = await res.json();
      if (!data.data || data.data.length === 0) return null;

      return data.data[0];
    },
    86400, // 24h
  );
}

/**
 * Fetch IPR for multiple stations in batch.
 * Returns a map of stationCode → IPRIndicator.
 */
export async function fetchIPRForStations(
  stationCodes: string[],
): Promise<Map<string, IPRIndicator>> {
  const result = new Map<string, IPRIndicator>();

  // Hub'Eau supports comma-separated station codes
  const batchSize = 20;
  for (let i = 0; i < stationCodes.length; i += batchSize) {
    const batch = stationCodes.slice(i, i + batchSize);

    for (const code of batch) {
      const ipr = await fetchIPRForStation(code);
      if (ipr) result.set(code, ipr);
    }
  }

  return result;
}
