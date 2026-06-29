import { describe, expect, it } from 'vitest';
import { formatSpotName } from '@/lib/spot-name';

describe('formatSpotName', () => {
  it('retire le suffixe technique (DEPT-EXTERNALID) en fin de nom', () => {
    expect(formatSpotName({ name: 'Jetée (01-25797529)' })).toBe('Jetée');
  });

  it('enrichit un nom auto-généré avec la commune quand on a nettoyé un suffixe technique', () => {
    expect(
      formatSpotName({ name: 'Jetée (74-10922417460)', commune: "Annecy" }),
    ).toBe('Jetée — Annecy');
  });

  it('remplace une base générique + suffixe technique par un libellé à la commune', () => {
    expect(
      formatSpotName({ name: 'Spot de pêche (74-10922417460)', commune: 'Annecy' }),
    ).toBe('Spot de pêche à Annecy');
  });

  it('replie sur le type d’eau quand la base est générique et la commune absente', () => {
    expect(
      formatSpotName({ name: 'Spot de pêche (74-10922417460)', commune: null, waterType: 'LAKE' }),
    ).toBe('Spot de pêche — Lac');
  });

  it('renvoie « Spot de pêche » non vide quand ni commune ni type d’eau ne sont connus', () => {
    expect(formatSpotName({ name: 'Spot de pêche', commune: null, waterType: null })).toBe(
      'Spot de pêche',
    );
  });

  it('ne touche PAS à un vrai nom utilisateur sans suffixe technique (renvoyé tel quel)', () => {
    expect(
      formatSpotName({ name: 'Pont de la Caille', commune: 'Cruseilles' }),
    ).toBe('Pont de la Caille');
  });

  it('préserve une parenthèse légitime au milieu du nom (non ancrée en fin)', () => {
    expect(formatSpotName({ name: 'Étang (réserve) du Moulin' })).toBe('Étang (réserve) du Moulin');
  });

  it('gère une base devenue vide après strip (n’a que le suffixe technique)', () => {
    expect(formatSpotName({ name: '(01-25797529)', commune: 'Bourg-en-Bresse' })).toBe(
      'Spot de pêche à Bourg-en-Bresse',
    );
  });

  it('ignore un waterType inconnu et reste sur « Spot de pêche » sans commune', () => {
    expect(
      formatSpotName({ name: 'Spot de pêche', waterType: 'UNKNOWN_ENUM' }),
    ).toBe('Spot de pêche');
  });

  it('trim les espaces autour du suffixe technique', () => {
    expect(formatSpotName({ name: 'Jetée   (01-25797529)  ' })).toBe('Jetée');
  });
});
