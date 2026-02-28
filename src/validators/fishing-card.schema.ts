import { z } from 'zod';

export const createFishingCardSchema = z.object({
  cardNumber: z.string().max(50).optional(),
  aappma: z.string().max(200).optional(),
  department: z.string().max(3).optional(),
  federation: z.string().max(200).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  hasReciprocity: z.boolean().default(false),
  reciprocityType: z.enum(['EHGO', 'CHI', 'URNE', 'InterFederale']).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateFishingCardSchema = createFishingCardSchema.partial();

export type CreateFishingCardInput = z.infer<typeof createFishingCardSchema>;
export type CreateFishingCardFormInput = z.input<typeof createFishingCardSchema>;
export type UpdateFishingCardInput = z.infer<typeof updateFishingCardSchema>;
