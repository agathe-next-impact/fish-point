/**
 * Agrégation des avis structurés (par critère) — logique PURE et testable.
 *
 * Un avis porte une note globale (`rating`) plus 5 critères optionnels, chacun
 * noté 1–5 ou `null` (non renseigné). On calcule la moyenne PAR critère en
 * ignorant les `null` : un critère noté par 3 avis sur 10 a sa moyenne sur ces 3
 * seulement (null-safe). Aucune dépendance React/Prisma ici.
 */

/** Les 5 clés de critère structuré portées par le modèle `Review`. */
export const REVIEW_CRITERIA = [
  'accessibility',
  'fishDensity',
  'cleanliness',
  'tranquility',
  'dataAccuracy',
] as const;

export type ReviewCriterionKey = (typeof REVIEW_CRITERIA)[number];

/** Libellés FR affichés sur la fiche (mapping label → champ Prisma). */
export const CRITERION_LABELS: Record<ReviewCriterionKey, string> = {
  accessibility: 'Accès',
  fishDensity: 'Poissons',
  cleanliness: 'Propreté',
  tranquility: 'Fréquentation',
  dataAccuracy: 'Précision des données',
};

/** Forme minimale d'un avis nécessaire à l'agrégation (critères nullable). */
export type ReviewCriteria = {
  [K in ReviewCriterionKey]?: number | null;
};

export interface CriterionAverage {
  key: ReviewCriterionKey;
  label: string;
  /** Moyenne sur les avis ayant noté CE critère, ou `null` si aucun. */
  average: number | null;
  /** Nombre d'avis ayant renseigné ce critère. */
  count: number;
}

/**
 * Moyenne d'un seul critère, en ignorant les valeurs nulles/absentes.
 * Retourne `null` si personne n'a noté ce critère.
 */
export function averageCriterion(
  reviews: readonly ReviewCriteria[],
  key: ReviewCriterionKey,
): { average: number | null; count: number } {
  let sum = 0;
  let count = 0;
  for (const review of reviews) {
    const value = review[key];
    // On ignore null, undefined et tout non-fini (jamais censé arriver après Zod).
    if (typeof value === 'number' && Number.isFinite(value)) {
      sum += value;
      count += 1;
    }
  }
  return { average: count > 0 ? sum / count : null, count };
}

/**
 * Moyennes des 5 critères structurés, dans l'ordre d'affichage `REVIEW_CRITERIA`.
 * Null-safe : chaque critère est moyenné indépendamment sur ses avis renseignés.
 */
export function aggregateReviewCriteria(
  reviews: readonly ReviewCriteria[],
): CriterionAverage[] {
  return REVIEW_CRITERIA.map((key) => {
    const { average, count } = averageCriterion(reviews, key);
    return { key, label: CRITERION_LABELS[key], average, count };
  });
}

/** Formate une moyenne pour l'affichage FR (1 décimale, virgule), ou « — » si nulle. */
export function formatCriterionAverage(average: number | null): string {
  if (average === null) return '—';
  return average.toFixed(1).replace('.', ',');
}
