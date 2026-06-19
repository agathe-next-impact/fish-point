import { z } from 'zod';
import {
  FISHING_MODE_TYPES,
  FISHING_TECHNIQUE_TYPES,
} from '@/lib/fishing-type-classification';
import type { SpotQueryFilters } from '@/lib/spot-filter-params';

export const WaterTypeEnum = z.enum([
  'RIVER', 'LAKE', 'POND', 'SEA', 'CANAL', 'STREAM',
]);

export const WaterCategoryEnum = z.enum(['FIRST', 'SECOND']);

export const FishingTypeEnum = z.enum([
  'SPINNING', 'FLY', 'COARSE', 'CARP', 'SURFCASTING',
  'TROLLING', 'FLOAT_TUBE', 'BOAT', 'SHORE',
]);

export const SpotStatusEnum = z.enum([
  'PENDING', 'APPROVED', 'REJECTED', 'REPORTED', 'ARCHIVED',
]);

export const AbundanceEnum = z.enum([
  'RARE', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH',
]);

export const accessibilitySchema = z.object({
  pmr: z.boolean().default(false),
  parking: z.boolean().default(false),
  boatLaunch: z.boolean().default(false),
  nightFishing: z.boolean().default(false),
});

export const spotSpeciesInputSchema = z.object({
  speciesId: z.string().min(1, 'Species ID is required'),
  abundance: AbundanceEnum,
});

export const createSpotSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(2000, 'La description ne peut pas dépasser 2000 caractères').optional(),
  latitude: z.number().min(-90, 'Latitude invalide').max(90, 'Latitude invalide'),
  longitude: z.number().min(-180, 'Longitude invalide').max(180, 'Longitude invalide'),
  waterType: WaterTypeEnum,
  waterCategory: WaterCategoryEnum.optional(),
  fishingTypes: z.array(FishingTypeEnum).min(1, 'Au moins un type de pêche est requis'),
  accessibility: accessibilitySchema.optional(),
  species: z.array(spotSpeciesInputSchema).optional(),
});

export const updateSpotSchema = createSpotSchema.partial().extend({
  status: SpotStatusEnum.optional(),
});

export const FishCategoryEnum = z.enum([
  'CARNIVORE', 'SALMONID', 'CYPRINID', 'CATFISH', 'MARINE', 'CRUSTACEAN', 'OTHER',
]);

export const spotFiltersSchema = z.object({
  waterType: z.array(WaterTypeEnum).optional(),
  waterCategory: WaterCategoryEnum.optional(),
  fishingTypes: z.array(FishingTypeEnum).optional(),
  fishCategory: z.array(FishCategoryEnum).optional(),
  minRating: z.number().min(0).max(5).optional(),
  minFishabilityScore: z.number().min(0).max(100).optional(),
  maxFishabilityScore: z.number().min(0).max(100).optional(),
  pmr: z.boolean().optional(),
  nightFishing: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  species: z.array(z.string()).optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  radius: z.number().min(1).max(100000).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const nearbyQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(100).max(100000).default(10000),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type CreateSpotFormInput = z.input<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;
export type SpotFiltersInput = z.infer<typeof spotFiltersSchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;

// ── Query liste Explorer (`GET /api/spots`) ─────────────────────────────────
// Centralisé ici (convergence des filtres, sous-étape 3) : ce schéma valide les
// query params de la liste à la frontière HTTP, en réutilisant les enums Zod déjà
// définis ci-dessus (WaterTypeEnum, WaterCategoryEnum, FishCategoryEnum). Le sous-
// ensemble « filtres sortie » est ensuite mappé vers le type canonique
// `SpotQueryFilters` (cf. `toSpotQueryFilters`) consommé par `buildSpotWhere`.
// Les concerns propres liste (bbox north/south/east/west, géo lat/lng/radius,
// pagination page/limit) restent gérés par la route. Extraction iso-fonctionnelle.

const AccessTypeEnum = z.enum([
  'FREE',
  'FISHING_CARD',
  'AAPPMA_SPECIFIC',
  'PAID',
  'MEMBERS_ONLY',
  'RESTRICTED',
  'PRIVATE',
]);
const FishingModeEnum = z.enum(FISHING_MODE_TYPES);
const FishingTechniqueEnum = z.enum(FISHING_TECHNIQUE_TYPES);

const numeric = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), schema);
const boolFlag = z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional();

/**
 * Validation Zod des query params de la liste Explorer (frontière /api/spots).
 * Tolérante : tout invalide → 400 ; les listes multivaluées arrivent via getAll.
 */
export const spotsListQuerySchema = z.object({
  page: numeric(z.number().int().min(1)).optional().default(1),
  limit: numeric(z.number().int().min(1).max(100)).optional().default(20),
  department: z.string().min(1).optional(),
  waterType: z.array(WaterTypeEnum).default([]),
  waterCategory: WaterCategoryEnum.optional(),
  fishCategory: z.array(FishCategoryEnum).default([]),
  accessType: AccessTypeEnum.optional(),
  search: z.string().optional(),
  minRating: numeric(z.number().min(0).max(5)).optional(),
  minFishabilityScore: numeric(z.number().min(0).max(100)).optional(),
  maxFishabilityScore: numeric(z.number().min(0).max(100)).optional(),
  species: z.array(z.string().min(1)).default([]),
  fishingMode: z.array(FishingModeEnum).default([]),
  fishingTechnique: z.array(FishingTechniqueEnum).default([]),
  parking: boolFlag,
  boatLaunch: boolFlag,
  pmr: boolFlag,
  nightFishing: boolFlag,
  // ── Filtres « affichage » (absorbés depuis l'ancien overlay carte) ──
  // Mêmes noms de params que la sérialisation partagée et la route tuiles :
  // `premiumOnly=true` et `origin=USER` (⇔ exclure les spots auto-découverts).
  // Appliqués désormais à la LISTE comme à la carte (parité, sous-étape 5).
  premiumOnly: boolFlag,
  origin: z.literal('USER').optional(),
  lat: numeric(z.number().min(-90).max(90)).optional(),
  lng: numeric(z.number().min(-180).max(180)).optional(),
  radius: numeric(z.number().min(100).max(200000)).optional(),
  north: numeric(z.number().min(-90).max(90)).optional(),
  south: numeric(z.number().min(-90).max(90)).optional(),
  east: numeric(z.number().min(-180).max(180)).optional(),
  west: numeric(z.number().min(-180).max(180)).optional(),
});

export type SpotsListQuery = z.infer<typeof spotsListQuerySchema>;

/**
 * Mappe le sous-ensemble « filtres sortie » de la query liste vers le type canonique
 * `SpotQueryFilters` (consommé par `buildSpotWhere`). Pur : les arrays vides (defaults
 * `[]`) deviennent `undefined` pour coller au type canonique ; `buildSpotWhere` les
 * ignore de toute façon (gardes `length > 0`). N'inclut PAS bbox/géo/pagination, qui
 * restent des concerns propres à la route.
 */
export function toSpotQueryFilters(q: SpotsListQuery): SpotQueryFilters {
  return {
    department: q.department,
    waterType: q.waterType.length > 0 ? q.waterType : undefined,
    waterCategory: q.waterCategory,
    fishCategory: q.fishCategory.length > 0 ? q.fishCategory : undefined,
    accessType: q.accessType,
    search: q.search,
    minRating: q.minRating,
    minFishabilityScore: q.minFishabilityScore,
    maxFishabilityScore: q.maxFishabilityScore,
    species: q.species.length > 0 ? q.species : undefined,
    fishingMode: q.fishingMode.length > 0 ? q.fishingMode : undefined,
    fishingTechnique: q.fishingTechnique.length > 0 ? q.fishingTechnique : undefined,
    parking: q.parking,
    boatLaunch: q.boatLaunch,
    pmr: q.pmr,
    nightFishing: q.nightFishing,
    // Filtres « affichage » : symétrique de `serializeSpotFilters`. On ne pose une
    // contrainte canonique QUE pour la valeur restrictive (sinon `undefined`), pour
    // que `buildSpotWhere` n'ajoute la clause que dans ce cas (cf. ses gardes ===).
    premiumOnly: q.premiumOnly === true ? true : undefined,
    showAutoDiscovered: q.origin === 'USER' ? false : undefined,
  };
}
