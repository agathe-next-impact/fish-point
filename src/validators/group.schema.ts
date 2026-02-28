import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const createTripSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  spotId: z.string().optional(),
  date: z.string().datetime('Date invalide'),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, "Le code d'invitation est requis"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
