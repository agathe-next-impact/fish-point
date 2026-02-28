import { z } from 'zod';

export const shareCatchSchema = z.object({
  catchId: z.string().min(1, 'La prise est requise'),
  blurLocation: z.boolean().default(true),
  caption: z.string().max(500, 'La légende ne peut pas dépasser 500 caractères').optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Le commentaire est requis').max(500, 'Le commentaire ne peut pas dépasser 500 caractères'),
});

export type ShareCatchInput = z.infer<typeof shareCatchSchema>;
export type ShareCatchFormInput = z.input<typeof shareCatchSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
