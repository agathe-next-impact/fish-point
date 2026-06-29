/**
 * Traduction « filtres « sortie » canoniques → fragments SQL `Prisma.Sql` » pour les
 * chemins en **SQL brut PostGIS** : les tuiles MVT (`/api/spots/tiles`) et la bbox carte
 * (`/api/spots/bbox`).
 *
 * Pourquoi un module séparé de `spot-where.ts` (convergence des filtres, sous-étape 5) :
 * `buildSpotWhere` produit un `Prisma.SpotWhereInput` consommé par le QUERY BUILDER
 * (`prisma.spot.findMany`) de la LISTE. Les tuiles et la bbox, elles, doivent appeler des
 * fonctions PostGIS (`ST_AsMVTGeom`, `ST_Intersects`, …) impossibles à exprimer via le
 * query builder → elles utilisent `prisma.$queryRaw`. Ce module factorise la portion
 * `WHERE` « filtres sortie » de ces deux chemins SQL en UNE source, pour qu'ils ne
 * divergent jamais (la tuile filtrait, la bbox non → la copie JS de `MapContainer`
 * compensait ; supprimée en sous-étape 5).
 *
 * SÉMANTIQUE IDENTIQUE à `buildSpotWhere` (mêmes filtres, mêmes règles) :
 *   - FREE inclut `accessType IS NULL` ;
 *   - mode + technique = intersection sur l'array `fishingTypes` (deux `&&` distincts) ;
 *   - accessibilité = clés JSON bornées (liste figée) ;
 *   - premiumOnly ⇒ `isPremium = true` ; origin=USER ⇒ `dataOrigin = 'USER'`.
 * Le périmètre EXCLUT la base `status` et la géométrie (bbox/tuile), propres à chaque route.
 *
 * SÉCURITÉ : aucune interpolation de chaîne brute. Toutes les valeurs passent par les
 * placeholders paramétrés de `Prisma.sql`/`Prisma.join`. Les clés d'accessibilité
 * proviennent d'une liste figée (`activeAccessibilityFlags`) et modes/techniques sont
 * filtrés sur des ensembles connus (`splitFishingTypes`) — pas d'injection possible.
 *
 * Pur, déterministe, sans I/O — testé unitairement (`tests/unit/lib/spot-where-sql.test.ts`).
 */

import { Prisma } from '@prisma/client';
import {
  parseSpotFilterParams,
  splitFishingTypes,
  activeAccessibilityFlags,
} from '@/lib/spot-filter-params';

/**
 * Construit la liste des fragments `WHERE` « filtres sortie » (cumulés en `AND` par
 * l'appelant) à partir des query params bruts. Renvoie un tableau éventuellement vide.
 *
 * L'appelant assemble : `WHERE <base géo/status> AND <join(fragments, ' AND ')>`.
 * Tolère l'alias legacy `fishingType` (singulier, sans distinction mode/technique) pour
 * les vieux liens — comme la route tuiles le faisait déjà.
 */
export function buildSpotFilterSql(searchParams: URLSearchParams): Prisma.Sql[] {
  // Vocabulaire de filtres PARTAGÉ avec la liste (`/api/spots`) et les tuiles : source
  // unique `parseSpotFilterParams`. Les deux chemins SQL appliquent donc exactement les
  // mêmes filtres « sortie » que la liste.
  const shared = parseSpotFilterParams(searchParams);
  const { modes, techniques } = splitFishingTypes(shared);

  // `parseSpotFilterParams` mappe déjà `origin=USER` → `showAutoDiscovered=false` et
  // `premiumOnly=true` → `premiumOnly=true`. L'alias legacy `fishingType` n'est plus émis
  // par l'UI ; toléré ici par robustesse (vieux liens).
  const legacyFishingTypes = searchParams.getAll('fishingType').filter(Boolean);

  const filters: Prisma.Sql[] = [];

  if (shared.waterType && shared.waterType.length > 0) {
    filters.push(Prisma.sql`s."waterType"::text IN (${Prisma.join(shared.waterType)})`);
  }
  if (shared.waterCategory) {
    filters.push(Prisma.sql`s."waterCategory"::text = ${shared.waterCategory}`);
  }
  if (shared.search) {
    const like = `%${shared.search}%`;
    filters.push(Prisma.sql`(s."name" ILIKE ${like} OR s."commune" ILIKE ${like})`);
  }
  if (shared.department) {
    filters.push(Prisma.sql`s."department" = ${shared.department}`);
  }

  // Accès au droit de pêche (FREE inclut les spots sans accessType, cf. /api/spots).
  if (shared.accessType) {
    if (shared.accessType === 'FREE') {
      filters.push(Prisma.sql`(s."accessType" = 'FREE'::"AccessType" OR s."accessType" IS NULL)`);
    } else {
      filters.push(Prisma.sql`s."accessType"::text = ${shared.accessType}`);
    }
  }

  // Espèce précise (relation SpotSpecies par id) et catégorie de poisson (par enum).
  if (shared.species && shared.species.length > 0) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "spot_species" ss
      WHERE ss."spotId" = s."id" AND ss."speciesId" IN (${Prisma.join(shared.species)})
    )`);
  }
  if (shared.fishCategory && shared.fishCategory.length > 0) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "spot_species" ss
      JOIN "fish_species" fs ON fs."id" = ss."speciesId"
      WHERE ss."spotId" = s."id" AND fs."category"::text IN (${Prisma.join(shared.fishCategory)})
    )`);
  }

  // Mode + technique = même colonne `fishingTypes` (array enum) : intersection des deux
  // intentions, exactement comme /api/spots. Alias legacy `fishingType` traité à part.
  if (modes.length > 0) {
    filters.push(Prisma.sql`s."fishingTypes"::text[] && ARRAY[${Prisma.join(modes)}]::text[]`);
  }
  if (techniques.length > 0) {
    filters.push(Prisma.sql`s."fishingTypes"::text[] && ARRAY[${Prisma.join(techniques)}]::text[]`);
  }
  if (legacyFishingTypes.length > 0) {
    filters.push(
      Prisma.sql`s."fishingTypes"::text[] && ARRAY[${Prisma.join(legacyFishingTypes)}]::text[]`,
    );
  }

  if (shared.minRating != null && shared.minRating > 0) {
    filters.push(Prisma.sql`s."averageRating" >= ${shared.minRating}`);
  }
  if (shared.minFishabilityScore != null && shared.minFishabilityScore > 0) {
    filters.push(Prisma.sql`s."fishabilityScore" >= ${shared.minFishabilityScore}`);
  }
  if (shared.maxFishabilityScore != null && shared.maxFishabilityScore > 0) {
    filters.push(Prisma.sql`s."fishabilityScore" <= ${shared.maxFishabilityScore}`);
  }

  // Accès physique : booléens dans le JSON `accessibility` (parking/boatLaunch/pmr/night).
  // Le flag est borné en `text` (clé JSON) ; les valeurs proviennent d'une liste figée.
  for (const flag of activeAccessibilityFlags(shared)) {
    filters.push(Prisma.sql`s."accessibility"->>(${flag}::text) = 'true'`);
  }

  // Filtres « affichage » (overlay carte absorbé) : `origin=USER` ⇔ masquer les
  // auto-découverts ; `premiumOnly=true` ⇔ spots premium uniquement.
  if (shared.showAutoDiscovered === false) {
    filters.push(Prisma.sql`s."dataOrigin" = ${'USER'}::"DataOrigin"`);
  }
  if (shared.premiumOnly === true) {
    filters.push(Prisma.sql`s."isPremium" = true`);
  }

  // Modèle 3 niveaux : défaut = plans d'eau (WATER_BODY) ; une ACCESS_ZONE n'apparaît
  // que si explicitement demandée via `kind` (la valeur explicite REMPLACE le défaut).
  // MÊME politique que `buildSpotWhere` (parité liste ↔ carte). Ajouté en dernier pour
  // ne pas décaler l'ordre des autres fragments. Valeurs paramétrées (anti-injection).
  const kinds = shared.kind && shared.kind.length > 0 ? shared.kind : ['WATER_BODY'];
  filters.push(Prisma.sql`s."kind"::text IN (${Prisma.join(kinds)})`);

  return filters;
}
