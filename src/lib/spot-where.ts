/**
 * Traduction « filtres « sortie » canoniques → clause WHERE Prisma » de la liste Explorer.
 *
 * Pourquoi ici (convergence des modèles de filtres, sous-étape 2) :
 * la sous-étape 1 a factorisé le PARSING/SÉRIALISATION des filtres (`spot-filter-params.ts`)
 * partagé entre la liste (`/api/spots`) et les tuiles. Mais la TRADUCTION du type canonique
 * `SpotQueryFilters` vers l'objet `where` Prisma restait inline dans `/api/spots/route.ts`.
 * Ce module l'extrait en une fonction PURE et testable, pour supprimer la duplication
 * résiduelle côté serveur et garantir une sémantique unique (FREE inclut `accessType: null`,
 * mode + technique = intersection via `fishingTypes hasSome`, accessibilité via `path`/`equals`).
 *
 * IMPORTANT — périmètre :
 * Cette fonction ne traduit QUE le sous-ensemble partagé `SpotQueryFilters`. Les concerns
 * propres à la liste restent dans le route handler et sont fusionnés par-dessus :
 *   - base `status: 'APPROVED'` ;
 *   - bornes géographiques (north/south/east/west) et rayon (lat/lng/radius) — hors type canonique ;
 *   - pagination (page/limit/skip).
 * Le `where` final = { status, ...buildSpotWhere(filters), ...(géo) } (cf. route.ts).
 *
 * Pur, déterministe, sans I/O — testé unitairement (`tests/unit/lib/spot-where.test.ts`).
 */

import type {
  Prisma,
  WaterType,
  WaterCategory,
  AccessType,
  FishCategory,
  FishingType,
} from '@prisma/client';
import type { SpotQueryFilters } from '@/lib/spot-filter-params';
import { splitFishingTypes, activeAccessibilityFlags } from '@/lib/spot-filter-params';

/**
 * Construit la portion `where` Prisma dérivée des filtres « sortie » canoniques.
 *
 * Extraction ISO-fonctionnelle du bloc historiquement inline dans `/api/spots/route.ts` :
 * mêmes clés, même sémantique. Combine des clés de premier niveau (department, waterType,
 * search via `OR`, accessType simple, waterCategory, averageRating, fishabilityScore) avec
 * un tableau `AND` pour les conditions cumulables sans collision (FREE, espèce, modes,
 * techniques, accessibilité). `AND` n'est ajouté que s'il est non vide, pour rester minimal.
 */
export function buildSpotWhere(filters: SpotQueryFilters): Prisma.SpotWhereInput {
  const where: Prisma.SpotWhereInput = {};
  // Conditions AND combinables (FREE, relation species, fishingTypes, accessibilité) :
  // regroupées ici pour ne pas s'écraser entre elles ni écraser `OR` (search).
  const and: Prisma.SpotWhereInput[] = [];

  if (filters.department) {
    where.department = filters.department;
  }
  if (filters.waterType && filters.waterType.length > 0) {
    // SpotQueryFilters garde les enums en `string` (type canonique découplé de Prisma) ;
    // les valeurs sont validées en amont (Zod / filtrage défensif) → cast sûr à la frontière Prisma.
    where.waterType = { in: filters.waterType as WaterType[] };
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { commune: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.accessType) {
    if (filters.accessType === 'FREE') {
      // "Libre" inclut les spots sans accessType (valeur par défaut).
      and.push({ OR: [{ accessType: 'FREE' }, { accessType: null }] });
    } else {
      where.accessType = filters.accessType as AccessType;
    }
  }
  if (filters.waterCategory) {
    where.waterCategory = filters.waterCategory as WaterCategory;
  }
  if (filters.fishCategory && filters.fishCategory.length > 0) {
    where.species = {
      some: { species: { category: { in: filters.fishCategory as FishCategory[] } } },
    };
  }

  // ── Filtres « sortie » ──────────────────────────────────────────────
  // Espèce précise : relation SpotSpecies → FishSpecies (par id). Combiné en AND
  // pour ne pas écraser un éventuel filtre fishCategory (les deux ciblent species).
  if (filters.species && filters.species.length > 0) {
    and.push({ species: { some: { speciesId: { in: filters.species } } } });
  }

  // Mode + technique filtrent la MÊME colonne `fishingTypes` (array enum). On les
  // sépare en UI mais on réunit ici : un spot doit contenir AU MOINS un des modes
  // ET au moins une des techniques demandés (intersection des deux intentions).
  const { modes, techniques } = splitFishingTypes(filters);
  if (modes.length > 0) {
    and.push({ fishingTypes: { hasSome: modes as FishingType[] } });
  }
  if (techniques.length > 0) {
    and.push({ fishingTypes: { hasSome: techniques as FishingType[] } });
  }

  // Accès physique : booléens stockés dans le JSON `accessibility`.
  for (const flag of activeAccessibilityFlags(filters)) {
    and.push({ accessibility: { path: [flag], equals: true } });
  }

  if (filters.minRating !== undefined && filters.minRating > 0) {
    where.averageRating = { gte: filters.minRating };
  }

  const minScore = filters.minFishabilityScore ?? 0;
  const maxScore = filters.maxFishabilityScore ?? 0;
  if (minScore > 0 || maxScore > 0) {
    const scoreFilter: Prisma.FloatNullableFilter = {};
    if (minScore > 0) scoreFilter.gte = minScore;
    if (maxScore > 0) scoreFilter.lte = maxScore;
    where.fishabilityScore = scoreFilter;
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}
