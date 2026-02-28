import { z } from 'zod';

export const createPrivateSpotSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  description: z.string().max(2000, 'La description ne doit pas dépasser 2000 caractères').optional(),
  latitude: z.number().min(-90, 'Latitude invalide').max(90, 'Latitude invalide'),
  longitude: z.number().min(-180, 'Longitude invalide').max(180, 'Longitude invalide'),
  color: z.string().optional().default('#3b82f6'),
  icon: z.string().optional().default('pin'),
  notes: z.string().max(5000, 'Les notes ne doivent pas dépasser 5000 caractères').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags').optional(),
});

export const updatePrivateSpotSchema = createPrivateSpotSchema.partial();

export const createVisitSchema = z.object({
  notes: z.string().max(2000, 'Les notes ne doivent pas dépasser 2000 caractères').optional(),
  rating: z.number().int().min(1, 'La note minimale est 1').max(5, 'La note maximale est 5').optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
});

export type CreatePrivateSpotInput = z.infer<typeof createPrivateSpotSchema>;
export type CreatePrivateSpotFormInput = z.input<typeof createPrivateSpotSchema>;
export type UpdatePrivateSpotInput = z.infer<typeof updatePrivateSpotSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
