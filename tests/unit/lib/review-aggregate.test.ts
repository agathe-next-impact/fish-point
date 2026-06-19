import { describe, expect, it } from 'vitest';
import {
  aggregateReviewCriteria,
  averageCriterion,
  formatCriterionAverage,
  REVIEW_CRITERIA,
  type ReviewCriteria,
} from '@/lib/review-aggregate';

describe('averageCriterion (null-safe)', () => {
  it('ignore les critères non notés (null) et ne moyenne que sur les avis renseignés', () => {
    const reviews: ReviewCriteria[] = [
      { fishDensity: 4 },
      { fishDensity: null },
      { fishDensity: 2 },
      {}, // critère absent → traité comme non renseigné
    ];
    expect(averageCriterion(reviews, 'fishDensity')).toEqual({ average: 3, count: 2 });
  });

  it('retourne average=null et count=0 quand personne n’a noté le critère', () => {
    const reviews: ReviewCriteria[] = [{ accessibility: null }, {}];
    expect(averageCriterion(reviews, 'accessibility')).toEqual({ average: null, count: 0 });
  });

  it('retourne average=null sur une liste vide', () => {
    expect(averageCriterion([], 'cleanliness')).toEqual({ average: null, count: 0 });
  });
});

describe('aggregateReviewCriteria', () => {
  it('produit les 5 critères dans l’ordre d’affichage avec leurs labels FR', () => {
    const result = aggregateReviewCriteria([]);
    expect(result.map((c) => c.key)).toEqual([...REVIEW_CRITERIA]);
    expect(result.map((c) => c.label)).toEqual([
      'Accès',
      'Poissons',
      'Propreté',
      'Fréquentation',
      'Précision des données',
    ]);
  });

  it('moyenne chaque critère indépendamment (null-safe par axe)', () => {
    const reviews: ReviewCriteria[] = [
      { accessibility: 5, fishDensity: 3, cleanliness: null, tranquility: 1, dataAccuracy: 4 },
      { accessibility: 3, fishDensity: null, cleanliness: 4, tranquility: 5, dataAccuracy: 4 },
    ];
    const byKey = Object.fromEntries(aggregateReviewCriteria(reviews).map((c) => [c.key, c]));
    expect(byKey.accessibility).toMatchObject({ average: 4, count: 2 });
    expect(byKey.fishDensity).toMatchObject({ average: 3, count: 1 });
    expect(byKey.cleanliness).toMatchObject({ average: 4, count: 1 });
    expect(byKey.tranquility).toMatchObject({ average: 3, count: 2 });
    expect(byKey.dataAccuracy).toMatchObject({ average: 4, count: 2 });
  });
});

describe('formatCriterionAverage', () => {
  it('formate avec une décimale et une virgule', () => {
    expect(formatCriterionAverage(3.75)).toBe('3,8');
    expect(formatCriterionAverage(4)).toBe('4,0');
  });

  it('affiche un tiret quand la moyenne est nulle', () => {
    expect(formatCriterionAverage(null)).toBe('—');
  });
});
