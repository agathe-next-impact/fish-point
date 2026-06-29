import { describe, expect, it } from 'vitest';
import {
  countConditions,
  deriveDayVerdict,
  summarizeDayConditions,
  sortConditionsForDisplay,
  type DayConditionFactor,
} from '@/lib/day-conditions';

const factor = (
  name: string,
  impact: DayConditionFactor['impact'],
): DayConditionFactor => ({ name, impact, description: `${name} desc` });

describe('countConditions', () => {
  it('compte chaque impact et expose le total réel', () => {
    const counts = countConditions([
      factor('Vent', 'positive'),
      factor('Pression', 'positive'),
      factor('UV', 'neutral'),
      factor('Sécheresse', 'negative'),
    ]);
    expect(counts).toEqual({ positive: 2, neutral: 1, negative: 1, total: 4 });
  });

  it('renvoie un total nul sur liste vide (pas de signal inventé)', () => {
    expect(countConditions([])).toEqual({ positive: 0, neutral: 0, negative: 0, total: 0 });
  });
});

describe('deriveDayVerdict', () => {
  it('inconnu quand aucun signal n’est disponible', () => {
    expect(deriveDayVerdict({ positive: 0, neutral: 0, negative: 0, total: 0 })).toBe('inconnu');
  });

  it('un défavorable prime sur des favorables (vigilance go/no-go)', () => {
    expect(deriveDayVerdict({ positive: 3, neutral: 0, negative: 1, total: 4 })).toBe('defavorable');
  });

  it('favorable quand au moins un favorable et aucun défavorable', () => {
    expect(deriveDayVerdict({ positive: 1, neutral: 2, negative: 0, total: 3 })).toBe('favorable');
  });

  it('mitige quand uniquement des neutres', () => {
    expect(deriveDayVerdict({ positive: 0, neutral: 2, negative: 0, total: 2 })).toBe('mitige');
  });
});

describe('summarizeDayConditions', () => {
  it('combine comptage et verdict en une passe', () => {
    const summary = summarizeDayConditions([
      factor('Vent', 'positive'),
      factor('Crues', 'negative'),
    ]);
    expect(summary.counts.total).toBe(2);
    expect(summary.verdict).toBe('defavorable');
  });
});

describe('sortConditionsForDisplay', () => {
  it('remonte les défavorables, puis favorables, puis neutres — sans muter l’entrée', () => {
    const input = [
      factor('UV', 'neutral'),
      factor('Vent', 'positive'),
      factor('Sécheresse', 'negative'),
    ];
    const sorted = sortConditionsForDisplay(input);
    expect(sorted.map((f) => f.impact)).toEqual(['negative', 'positive', 'neutral']);
    // L'entrée d'origine n'est pas réordonnée.
    expect(input.map((f) => f.impact)).toEqual(['neutral', 'positive', 'negative']);
  });

  it('est stable entre facteurs de même impact', () => {
    const input = [
      factor('Vent', 'positive'),
      factor('Pression', 'positive'),
    ];
    expect(sortConditionsForDisplay(input).map((f) => f.name)).toEqual(['Vent', 'Pression']);
  });
});
