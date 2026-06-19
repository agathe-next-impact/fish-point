import { z } from 'zod';

/**
 * Critère d'avis : note entière 1–5, OPTIONNELLE et NULLABLE.
 *
 * `null` = critère volontairement non renseigné (l'utilisateur n'a pas voulu se
 * prononcer sur cet axe). `undefined` (absent) est traité comme `null` côté
 * persistance. On veut distinguer « pas d'avis sur ce critère » d'une note 0
 * (interdite) — d'où la borne min à 1.
 */
const criterionSchema = z.number().int().min(1).max(5).nullable().optional();

export const createReviewSchema = z.object({
  spotId: z.string().min(1, 'Le spot est requis'),
  rating: z.number().int().min(1, 'La note minimale est 1').max(5, 'La note maximale est 5'),
  comment: z.string().max(2000).nullable().optional(),
  /** Accès (facilité d'accès au site). */
  accessibility: criterionSchema,
  /** Poissons (densité / présence du poisson). */
  fishDensity: criterionSchema,
  /** Propreté du site. */
  cleanliness: criterionSchema,
  /** Tranquillité / fréquentation. */
  tranquility: criterionSchema,
  /** Précision des données affichées sur la fiche. */
  dataAccuracy: criterionSchema,
});

export const updateReviewSchema = createReviewSchema.partial().omit({ spotId: true });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
