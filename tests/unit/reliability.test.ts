import { describe, it, expect } from 'vitest';
import { computeReliability, type ReliabilityInput } from '@/lib/reliability';

const NOW = new Date('2026-06-18T12:00:00.000Z');

function isoDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const baseInput: ReliabilityInput = {
  accessConfidence: 80,
  lastCheckedAt: isoDaysAgo(2),
  scoreUpdatedAt: isoDaysAgo(1),
  speciesCount: 5,
  hasWaterQuality: true,
  hasObservations: true,
  now: NOW,
};

describe('computeReliability', () => {
  it('returns "high" when access is confirmed, data is fresh and complete', () => {
    const r = computeReliability(baseInput);
    expect(r.tier).toBe('high');
    expect(r.label).toBe('élevée');
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('returns "low" when nothing is known', () => {
    const r = computeReliability({
      accessConfidence: null,
      lastCheckedAt: null,
      scoreUpdatedAt: null,
      speciesCount: 0,
      hasWaterQuality: false,
      hasObservations: false,
      now: NOW,
    });
    expect(r.tier).toBe('low');
    expect(r.label).toBe('faible');
    expect(r.reasons).toContain("Type d'accès non vérifié");
    expect(r.reasons).toContain('Aucune date de vérification connue');
  });

  it('downgrades to "medium" when verification is stale', () => {
    const r = computeReliability({ ...baseInput, lastCheckedAt: isoDaysAgo(120), scoreUpdatedAt: isoDaysAgo(200) });
    expect(r.tier).toBe('medium');
  });

  it('downgrades when access confidence is weak', () => {
    const strong = computeReliability(baseInput);
    const weak = computeReliability({ ...baseInput, accessConfidence: 20 });
    expect(strong.tier).toBe('high');
    expect(weak.tier).toBe('medium');
  });

  it('uses scoreUpdatedAt freshness when lastCheckedAt is missing', () => {
    const r = computeReliability({ ...baseInput, lastCheckedAt: null });
    expect(r.tier).toBe('high');
    expect(r.reasons).toContain('Données vérifiées récemment (moins de 7 jours)');
  });

  it('reflects partial data completeness in reasons', () => {
    const r = computeReliability({
      ...baseInput,
      hasWaterQuality: false,
      hasObservations: false,
    });
    expect(r.reasons.some((x) => x.startsWith('Données partielles'))).toBe(true);
  });

  it('treats invalid date strings as unknown freshness', () => {
    const r = computeReliability({ ...baseInput, lastCheckedAt: 'not-a-date', scoreUpdatedAt: 'nope' });
    expect(r.reasons).toContain('Aucune date de vérification connue');
  });

  it('clamps negative ages from future dates to fresh', () => {
    const r = computeReliability({ ...baseInput, lastCheckedAt: isoDaysAgo(-5), scoreUpdatedAt: null });
    expect(r.reasons).toContain('Données vérifiées récemment (moins de 7 jours)');
  });
});
