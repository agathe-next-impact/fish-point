import { z } from 'zod';

export const WaterTypeEnum = z.enum([
  'RIVER', 'LAKE', 'POND', 'SEA', 'CANAL', 'RESERVOIR', 'STREAM',
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

const optionalBooleanQuery = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean().optional());

function optionalArrayQuery<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());
}

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
  department: z.string().min(1).max(100).optional(),
  commune: z.string().min(1).max(100).optional(),
  waterType: WaterTypeEnum,
  waterCategory: WaterCategoryEnum.optional(),
  fishingTypes: z.array(FishingTypeEnum).min(1, 'Au moins un type de pêche est requis'),
  accessibility: accessibilitySchema.optional(),
  species: z.array(spotSpeciesInputSchema).optional(),
});

export const updateSpotSchema = createSpotSchema.partial().extend({
  status: SpotStatusEnum.optional(),
});

export const authorUpdateSpotSchema = createSpotSchema.partial();

export const spotFiltersSchema = z.object({
  waterType: optionalArrayQuery(WaterTypeEnum),
  fishingTypes: optionalArrayQuery(FishingTypeEnum),
  minRating: z.coerce.number().min(0).max(5).optional(),
  pmr: optionalBooleanQuery,
  nightFishing: optionalBooleanQuery,
  isPremium: optionalBooleanQuery,
  species: optionalArrayQuery(z.string()),
  department: z.string().optional(),
  search: z.string().optional(),
  radius: z.coerce.number().min(1).max(100000).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const nearbyQuerySchema = spotFiltersSchema.extend({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(100000).default(10000),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;
export type AuthorUpdateSpotInput = z.infer<typeof authorUpdateSpotSchema>;
export type SpotFiltersInput = z.infer<typeof spotFiltersSchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
