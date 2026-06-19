/**
 * Logique PURE d'agrégation des prises publiques d'un spot, groupées par espèce,
 * et du tri « espèces trophées d'abord ». Aucun I/O ici → 100 % testable sans
 * monter Prisma ni react-query.
 *
 * Confidentialité : ce module ne manipule QUE des champs publiquement exposables
 * (espèce, dates, taille/poids agrégés). La géolocalisation privée des prises
 * (`catchLatitude`/`catchLongitude`) n'est jamais lue ici — elle n'entre pas dans
 * ces types, par construction.
 */

/**
 * Espèces « trophées » recherchées par les pêcheurs — mises en avant en premier.
 * Source de vérité partagée (le service de scoring maintient sa propre copie
 * historique ; on ne la couple pas pour éviter une cascade hors scope).
 * Comparaison par inclusion, insensible à la casse, sur le nom d'espèce.
 */
export const TROPHY_SPECIES = [
  'brochet', 'sandre', 'truite', 'carpe', 'black bass', 'silure',
  'bar', 'loup', 'dorade', 'saumon', 'ombre',
] as const;

/** Vrai si le nom d'espèce correspond à une espèce trophée. */
export function isTrophySpecies(speciesName: string): boolean {
  const name = speciesName.toLowerCase();
  return TROPHY_SPECIES.some((t) => name.includes(t));
}

/**
 * Une prise publique brute, telle que sélectionnée côté serveur. Volontairement
 * minimale : aucune géoloc, aucune identité d'auteur. C'est le contrat de données
 * qui garantit qu'aucun champ privé ne peut transiter par l'agrégation.
 */
export interface PublicCatchRow {
  speciesId: string;
  speciesName: string;
  scientificName: string | null;
  category: string;
  /** Date de capture, ISO 8601. */
  caughtAt: string;
  /** Poids en kg, si renseigné. */
  weight: number | null;
  /** Longueur en cm, si renseignée. */
  length: number | null;
}

/** Agrégat d'une espèce pour un spot (prises publiques uniquement). */
export interface RecentCatchesBySpecies {
  speciesId: string;
  speciesName: string;
  scientificName: string | null;
  category: string;
  isTrophy: boolean;
  /** Nombre total de prises publiques de cette espèce sur le spot. */
  count: number;
  /** Date de la prise la plus récente, ISO 8601. */
  lastCaughtAt: string;
  /** Bornes de poids (kg) observées, null si aucune prise pesée. */
  minWeight: number | null;
  maxWeight: number | null;
  /** Bornes de longueur (cm) observées, null si aucune prise mesurée. */
  minLength: number | null;
  maxLength: number | null;
}

/**
 * Agrège une liste plate de prises publiques en un agrégat par espèce, trié par
 * récence (dernière prise la plus récente) puis fréquence (nombre de prises).
 *
 * - Tri principal : `lastCaughtAt` décroissant (l'activité récente prime).
 * - Départage : `count` décroissant, puis nom d'espèce (stable, déterministe).
 * - Cas vide : renvoie `[]`.
 *
 * Hypothèse : `rows` ne contient déjà QUE des prises publiques (filtre
 * `isPublic = true` appliqué en amont). Cette fonction ne refiltre pas la
 * visibilité — elle n'a pas accès à ce champ par construction.
 */
export function aggregateRecentCatches(rows: PublicCatchRow[]): RecentCatchesBySpecies[] {
  const bySpecies = new Map<string, RecentCatchesBySpecies>();

  for (const row of rows) {
    const existing = bySpecies.get(row.speciesId);
    if (!existing) {
      bySpecies.set(row.speciesId, {
        speciesId: row.speciesId,
        speciesName: row.speciesName,
        scientificName: row.scientificName,
        category: row.category,
        isTrophy: isTrophySpecies(row.speciesName),
        count: 1,
        lastCaughtAt: row.caughtAt,
        minWeight: row.weight,
        maxWeight: row.weight,
        minLength: row.length,
        maxLength: row.length,
      });
      continue;
    }

    existing.count += 1;
    if (row.caughtAt > existing.lastCaughtAt) existing.lastCaughtAt = row.caughtAt;
    existing.minWeight = minNullable(existing.minWeight, row.weight);
    existing.maxWeight = maxNullable(existing.maxWeight, row.weight);
    existing.minLength = minNullable(existing.minLength, row.length);
    existing.maxLength = maxNullable(existing.maxLength, row.length);
  }

  return Array.from(bySpecies.values()).sort((a, b) => {
    if (a.lastCaughtAt !== b.lastCaughtAt) return a.lastCaughtAt < b.lastCaughtAt ? 1 : -1;
    if (a.count !== b.count) return b.count - a.count;
    return a.speciesName.localeCompare(b.speciesName, 'fr');
  });
}

/** Min en ignorant les `null` (un `null` ne contamine pas une borne existante). */
function minNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

/** Max en ignorant les `null`. */
function maxNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

/** Ordre d'abondance (du plus abondant au plus rare) pour départager les espèces. */
const ABUNDANCE_RANK: Record<string, number> = {
  VERY_HIGH: 5,
  HIGH: 4,
  MODERATE: 3,
  LOW: 2,
  RARE: 1,
};

/** Forme minimale requise pour ordonner les espèces du spot (sous-ensemble de `SpotSpeciesData`). */
export interface SortableSpecies {
  name: string;
  abundance: string;
}

/**
 * Trie les espèces d'un spot « trophées d'abord » : les espèces trophées
 * remontent en tête, puis on départage par abondance décroissante, puis par nom.
 * Tri PUR et stable (déterministe), sans muter l'entrée.
 */
export function sortSpeciesByTrophy<T extends SortableSpecies>(species: readonly T[]): T[] {
  return [...species].sort((a, b) => {
    const aTrophy = isTrophySpecies(a.name);
    const bTrophy = isTrophySpecies(b.name);
    if (aTrophy !== bTrophy) return aTrophy ? -1 : 1;

    const aRank = ABUNDANCE_RANK[a.abundance] ?? 0;
    const bRank = ABUNDANCE_RANK[b.abundance] ?? 0;
    if (aRank !== bRank) return bRank - aRank;

    return a.name.localeCompare(b.name, 'fr');
  });
}
