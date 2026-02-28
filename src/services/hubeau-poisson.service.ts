import type {
  HubeauPoissonStation,
  HubeauFishObservation,
  HubeauPaginatedResponse,
} from '@/types/ingestion';

const HUBEAU_BASE = 'https://hubeau.eaufrance.fr/api/v1/etat_piscicole';
const PAGE_SIZE = 1000;
const DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchFishStations(params?: {
  departement?: string;
  page?: number;
  size?: number;
}): Promise<HubeauPaginatedResponse<HubeauPoissonStation>> {
  const searchParams = new URLSearchParams({
    size: String(params?.size ?? PAGE_SIZE),
    page: String(params?.page ?? 1),
  });

  if (params?.departement) {
    searchParams.set('code_departement', params.departement);
  }

  const res = await fetch(`${HUBEAU_BASE}/stations?${searchParams}`);
  if (!res.ok && res.status !== 206) {
    throw new Error(`Hub'Eau Poisson stations error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchFishObservations(
  stationCode: string,
  params?: { size?: number; page?: number },
): Promise<HubeauPaginatedResponse<HubeauFishObservation>> {
  const searchParams = new URLSearchParams({
    code_station: stationCode,
    size: String(params?.size ?? PAGE_SIZE),
    page: String(params?.page ?? 1),
    fields: 'code_station,code_operation,date_operation,code_alternatif_taxon,nom_commun_taxon,nom_latin_taxon,effectif_lot',
  });

  const res = await fetch(`${HUBEAU_BASE}/observations?${searchParams}`);
  if (!res.ok && res.status !== 206) {
    throw new Error(`Hub'Eau Poisson observations error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetches all fish stations, paginating automatically.
 * Calls onBatch for each page of results.
 * Returns total number of stations fetched.
 */
export async function fetchAllFishStations(
  onBatch: (stations: HubeauPoissonStation[], page: number) => Promise<void>,
  departement?: string,
): Promise<number> {
  let page = 1;
  let totalFetched = 0;

  while (true) {
    const response = await fetchFishStations({ departement, page, size: PAGE_SIZE });

    if (response.data.length === 0) break;

    await onBatch(response.data, page);
    totalFetched += response.data.length;

    if (response.data.length < PAGE_SIZE || !response.next) break;

    page++;
    await delay(DELAY_MS);
  }

  return totalFetched;
}

/**
 * Fetches all observations for a station, paginating automatically.
 * Returns deduplicated observations (latest per species).
 */
export async function fetchAllObservationsForStation(
  stationCode: string,
): Promise<HubeauFishObservation[]> {
  const allObs: HubeauFishObservation[] = [];
  let page = 1;

  while (true) {
    const response = await fetchFishObservations(stationCode, { page, size: PAGE_SIZE });

    if (response.data.length === 0) break;
    allObs.push(...response.data);

    if (response.data.length < PAGE_SIZE || !response.next) break;

    page++;
    await delay(DELAY_MS);
  }

  return allObs;
}

/**
 * Fetch detailed individual data from Hub'Eau Aspe (listes endpoint).
 * Returns average weight and length per species for a station.
 */
export async function fetchAspeDetailedObservations(
  stationCode: string,
): Promise<Array<{
  speciesCode: string;
  speciesName: string;
  averageWeight: number | null;
  averageLength: number | null;
}>> {
  const searchParams = new URLSearchParams({
    code_station: stationCode,
    size: '1000',
    fields: 'code_alternatif_taxon,nom_commun_taxon,taille_individu_min,taille_individu_max,poids_individu',
  });

  try {
    const res = await fetch(`${HUBEAU_BASE}/listes?${searchParams}`);
    if (!res.ok && res.status !== 206) return [];

    const body = await res.json();
    const data = body.data ?? [];

    // Aggregate by species
    const speciesMap = new Map<string, {
      name: string;
      weights: number[];
      lengths: number[];
    }>();

    for (const item of data) {
      const code = item.code_alternatif_taxon as string | undefined;
      if (!code) continue;

      let existing = speciesMap.get(code);
      if (!existing) {
        existing = { name: (item.nom_commun_taxon as string) ?? code, weights: [], lengths: [] };
      }

      const weight = item.poids_individu as number | undefined;
      const sizeMin = item.taille_individu_min as number | undefined;
      const sizeMax = item.taille_individu_max as number | undefined;

      if (weight) existing.weights.push(weight);
      if (sizeMin && sizeMax) {
        existing.lengths.push((sizeMin + sizeMax) / 2);
      } else if (sizeMin) {
        existing.lengths.push(sizeMin);
      }

      speciesMap.set(code, existing);
    }

    return Array.from(speciesMap.entries()).map(([code, sp]) => ({
      speciesCode: code,
      speciesName: sp.name,
      averageWeight: sp.weights.length > 0
        ? Math.round(sp.weights.reduce((a, b) => a + b, 0) / sp.weights.length * 10) / 10
        : null,
      averageLength: sp.lengths.length > 0
        ? Math.round(sp.lengths.reduce((a, b) => a + b, 0) / sp.lengths.length * 10) / 10
        : null,
    }));
  } catch {
    return [];
  }
}
