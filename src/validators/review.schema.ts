import { z } from 'zod';

export const createReviewSchema = z.object({
  spotId: z.string().min(1, 'Le spot est requis'),
  rating: z.number().int().min(1, 'La note minimale est 1').max(5, 'La note maximale est 5'),
  comment: z.string().max(2000).optional(),
  fishDensity: z.number().int().min(1).max(5).optional(),
  cleanliness: z.number().int().min(1).max(5).optional(),
  tranquility: z.number().int().min(1).max(5).optional(),
  accessibility: z.number().int().min(1).max(5).optional(),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ spotId: true });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
