import { describe, expect, it } from 'vitest';
import { shouldShowDataUnavailable } from '@/components/spots/DataUnavailable';

describe('shouldShowDataUnavailable', () => {
  it('ne montre PAS pendant le chargement (skeleton préservé), même si le résultat paraît vide', () => {
    expect(shouldShowDataUnavailable({ isLoading: true, isError: false, isEmpty: true })).toBe(
      false,
    );
  });

  it('le chargement est prioritaire sur l’erreur et le vide', () => {
    expect(shouldShowDataUnavailable({ isLoading: true, isError: true, isEmpty: true })).toBe(
      false,
    );
  });

  it('ne montre PAS sur erreur (ne pas masquer une panne en « pas de donnée »)', () => {
    expect(shouldShowDataUnavailable({ isLoading: false, isError: true, isEmpty: true })).toBe(
      false,
    );
  });

  it('montre UNIQUEMENT sur succès vide (absence avérée)', () => {
    expect(shouldShowDataUnavailable({ isLoading: false, isError: false, isEmpty: true })).toBe(
      true,
    );
  });

  it('ne montre PAS sur succès avec données (rendu normal de la section)', () => {
    expect(shouldShowDataUnavailable({ isLoading: false, isError: false, isEmpty: false })).toBe(
      false,
    );
  });
});
