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
