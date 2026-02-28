import { z } from 'zod';

export const createCatchSchema = z.object({
  spotId: z.string().min(1, 'Le spot est requis'),
  speciesId: z.string().min(1, "L'espèce est requise"),
  weight: z.number().positive('Le poids doit être positif').optional(),
  length: z.number().positive('La taille doit être positive').optional(),
  technique: z.string().max(100).optional(),
  bait: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  isReleased: z.boolean().default(true),
  caughtAt: z.string().datetime().optional(),

  // Enhanced catch log fields
  lureType: z.string().max(100).optional(),
  lureColor: z.string().max(100).optional(),
  lureSize: z.string().max(100).optional(),
  rigType: z.string().max(100).optional(),
  hookSize: z.string().max(100).optional(),
  lineWeight: z.string().max(100).optional(),

  // Private geolocation
  catchLatitude: z.number().min(-90).max(90).optional(),
  catchLongitude: z.number().min(-180).max(180).optional(),

  // Extended weather data
  windSpeed: z.number().optional(),
  windDirection: z.number().optional(),
  cloudCover: z.number().optional(),
  humidity: z.number().optional(),

  // Offline sync
  clientId: z.string().optional(),

  // Visibility
  isPublic: z.boolean().default(true),
});

export const updateCatchSchema = createCatchSchema.partial();

export const catchFiltersSchema = z.object({
  userId: z.string().optional(),
  spotId: z.string().optional(),
  speciesId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type CreateCatchInput = z.infer<typeof createCatchSchema>;
export type CreateCatchFormInput = z.input<typeof createCatchSchema>;
export type UpdateCatchInput = z.infer<typeof updateCatchSchema>;
export type CatchFiltersInput = z.infer<typeof catchFiltersSchema>;
