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

export const spotFiltersSchema = z.object({
  waterType: z.array(WaterTypeEnum).optional(),
  fishingTypes: z.array(FishingTypeEnum).optional(),
  minRating: z.number().min(0).max(5).optional(),
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
