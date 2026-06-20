/**
 * Source UNIQUE de la traduction « filtres « sortie » → query string → WHERE » partagée
 * par les deux consommateurs de spots : la liste (`/api/spots`) et les tuiles vectorielles
 * (`/api/spots/tiles/[z]/[x]/[y]`).
 *
 * Pourquoi ici (convergence des modèles de filtres, sous-étape 1) :
 * historiquement, la liste et la carte sérialisaient/désérialisaient ces filtres
 * SÉPARÉMENT, avec des noms de params divergents (`fishingType` singulier côté tuiles,
 * `fishingMode`/`fishingTechnique`/`parking`/`boatLaunch` côté liste qui n'existaient PAS
 * côté tuiles). Résultat : un filtre « sortie » appliqué à la liste n'affectait pas les
 * marqueurs de la carte. Ce module factorise la sérialisation ET le parsing pour que les
 * DEUX chemins parlent le même vocabulaire de query params, sans dupliquer la logique
 * une troisième fois.
 *
 * Pur, déterministe, sans I/O — testé unitairement (`tests/unit/lib/spot-filter-params.test.ts`).
 */

import { FISHING_MODE_TYPES, FISHING_TECHNIQUE_TYPES } from '@/lib/fishing-type-classification';

/** Booléens d'accès physique stockés dans le JSON `accessibility` d'un spot. */
export type AccessibilityFlag = 'parking' | 'boatLaunch' | 'pmr' | 'nightFishing';

const ACCESSIBILITY_FLAGS: readonly AccessibilityFlag[] = [
  'parking',
  'boatLaunch',
  'pmr',
  'nightFishing',
];

const MODE_SET = new Set<string>(FISHING_MODE_TYPES);
const TECHNIQUE_SET = new Set<string>(FISHING_TECHNIQUE_TYPES);

/**
 * Niveaux de spot connus (modèle 3 niveaux). Sert au filtrage défensif du param `kind`
 * au parsing (écarte toute valeur arbitraire avant la requête SQL). Aligné sur l'enum
 * Prisma `SpotKind` et sur `SpotKindEnum` (Zod, `spot.schema.ts`).
 */
const SPOT_KINDS = ['WATER_BODY', 'ACCESS_ZONE'] as const;
const KIND_SET = new Set<string>(SPOT_KINDS);

/**
 * Forme canonique des filtres « spot » consommée par la liste ET la carte. C'est le
 * sous-ensemble partagé : les bornes géo (north/south/east/west) et la pagination
 * restent propres à chaque chemin (la carte borne via la tuile, la liste via la bbox).
 */
export interface SpotQueryFilters {
  /**
   * Niveau(x) de spot demandé(s) (modèle 3 niveaux). Absent ⇒ les builders
   * (`buildSpotWhere` / `buildSpotFilterSql`) appliquent le défaut WATER_BODY :
   * la liste et la carte ne montrent que les plans d'eau. Une valeur explicite
   * (`['ACCESS_ZONE']`, ou les deux) REMPLACE le défaut.
   */
  kind?: string[];
  waterType?: string[];
  waterCategory?: string;
  fishCategory?: string[];
  accessType?: string;
  search?: string;
  department?: string;
  minRating?: number;
  minFishabilityScore?: number;
  maxFishabilityScore?: number;
  species?: string[];
  fishingMode?: string[];
  fishingTechnique?: string[];
  parking?: boolean;
  boatLaunch?: boolean;
  pmr?: boolean;
  nightFishing?: boolean;
  /**
   * Réservé aux spots premium. Sérialisé `premiumOnly=true`. Filtre exclusif
   * carte (tuiles MVT + couches heatmap/fishability), absorbé depuis l'ancien
   * panneau overlay `MapFilters` (sous-étape 4 : un seul état de filtres).
   */
  premiumOnly?: boolean;
  /**
   * Inclut les spots auto-découverts (origine ≠ `USER`). `true` par défaut côté UI.
   * Quand `false`, sérialisé `origin=USER` (seuls les spots saisis par un pêcheur).
   * Filtre exclusif carte, absorbé depuis l'ancien overlay `MapFilters`.
   */
  showAutoDiscovered?: boolean;
}

/**
 * Sérialise les filtres canoniques en `URLSearchParams` (vocabulaire partagé liste/carte).
 * Omet toute valeur vide/`undefined`/`false` pour garder l'URL et la clé de cache stables.
 * Les listes sont sérialisées en params répétés (`getAll` côté serveur).
 */
export function serializeSpotFilters(filters: SpotQueryFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const k of filters.kind ?? []) params.append('kind', k);
  for (const type of filters.waterType ?? []) params.append('waterType', type);
  for (const cat of filters.fishCategory ?? []) params.append('fishCategory', cat);
  for (const id of filters.species ?? []) params.append('species', id);
  for (const mode of filters.fishingMode ?? []) params.append('fishingMode', mode);
  for (const tech of filters.fishingTechnique ?? []) params.append('fishingTechnique', tech);

  if (filters.waterCategory) params.set('waterCategory', filters.waterCategory);
  if (filters.accessType) params.set('accessType', filters.accessType);
  if (filters.search) params.set('search', filters.search);
  if (filters.department) params.set('department', filters.department);

  if (filters.minRating !== undefined && filters.minRating > 0) {
    params.set('minRating', String(filters.minRating));
  }
  if (filters.minFishabilityScore !== undefined && filters.minFishabilityScore > 0) {
    params.set('minFishabilityScore', String(filters.minFishabilityScore));
  }
  if (filters.maxFishabilityScore !== undefined && filters.maxFishabilityScore > 0) {
    params.set('maxFishabilityScore', String(filters.maxFishabilityScore));
  }

  for (const flag of ACCESSIBILITY_FLAGS) {
    if (filters[flag] === true) params.set(flag, 'true');
  }

  // Filtres exclusifs carte (absorbés depuis l'ancien overlay `MapFilters`). On
  // conserve EXACTEMENT les noms de params que la route tuiles lit déjà : `premiumOnly`
  // et `origin=USER`. `showAutoDiscovered` est implicitement `true` (cas par défaut) :
  // on ne pose `origin=USER` que pour l'exclusion explicite des spots auto-découverts.
  if (filters.premiumOnly === true) params.set('premiumOnly', 'true');
  if (filters.showAutoDiscovered === false) params.set('origin', 'USER');

  return params;
}

function parseNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Désérialise les query params (depuis une `URLSearchParams`) vers la forme canonique.
 * Tolérant : ignore les valeurs vides. Filtre mode/technique sur les ensembles connus
 * pour éviter qu'une valeur arbitraire ne fuite dans la requête SQL des tuiles.
 */
export function parseSpotFilterParams(searchParams: URLSearchParams): SpotQueryFilters {
  const kind = searchParams.getAll('kind').filter((k) => KIND_SET.has(k));
  const waterType = searchParams.getAll('waterType').filter(Boolean);
  const fishCategory = searchParams.getAll('fishCategory').filter(Boolean);
  const species = searchParams.getAll('species').filter(Boolean);
  const fishingMode = searchParams.getAll('fishingMode').filter((t) => MODE_SET.has(t));
  const fishingTechnique = searchParams
    .getAll('fishingTechnique')
    .filter((t) => TECHNIQUE_SET.has(t));

  return {
    kind: kind.length > 0 ? kind : undefined,
    waterType: waterType.length > 0 ? waterType : undefined,
    fishCategory: fishCategory.length > 0 ? fishCategory : undefined,
    species: species.length > 0 ? species : undefined,
    fishingMode: fishingMode.length > 0 ? fishingMode : undefined,
    fishingTechnique: fishingTechnique.length > 0 ? fishingTechnique : undefined,
    waterCategory: searchParams.get('waterCategory') ?? undefined,
    accessType: searchParams.get('accessType') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    department: searchParams.get('department') ?? undefined,
    minRating: parseNumber(searchParams.get('minRating')),
    minFishabilityScore: parseNumber(searchParams.get('minFishabilityScore')),
    maxFishabilityScore: parseNumber(searchParams.get('maxFishabilityScore')),
    parking: searchParams.get('parking') === 'true' || undefined,
    boatLaunch: searchParams.get('boatLaunch') === 'true' || undefined,
    pmr: searchParams.get('pmr') === 'true' || undefined,
    nightFishing: searchParams.get('nightFishing') === 'true' || undefined,
    // Filtres exclusifs carte (overlay absorbé) : `premiumOnly=true` et `origin=USER`
    // (⇔ exclure les auto-découverts). Symétrique de la sérialisation ci-dessus.
    premiumOnly: searchParams.get('premiumOnly') === 'true' || undefined,
    showAutoDiscovered: searchParams.get('origin') === 'USER' ? false : undefined,
  };
}

/** Renvoie les modes/techniques valides depuis une liste brute (filtrage défensif). */
export function splitFishingTypes(filters: SpotQueryFilters): {
  modes: string[];
  techniques: string[];
} {
  return {
    modes: (filters.fishingMode ?? []).filter((t) => MODE_SET.has(t)),
    techniques: (filters.fishingTechnique ?? []).filter((t) => TECHNIQUE_SET.has(t)),
  };
}

/** Liste ordonnée des flags d'accessibilité demandés (true uniquement). */
export function activeAccessibilityFlags(filters: SpotQueryFilters): AccessibilityFlag[] {
  return ACCESSIBILITY_FLAGS.filter((flag) => filters[flag] === true);
}
