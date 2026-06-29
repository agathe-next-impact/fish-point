import { describe, it, expect } from 'vitest';
import {
  aggregateRecentCatches,
  sortSpeciesByTrophy,
  isTrophySpecies,
  type PublicCatchRow,
} from '@/lib/spot-catches';

function row(partial: Partial<PublicCatchRow> & { speciesId: string; speciesName: string; caughtAt: string }): PublicCatchRow {
  return {
    scientificName: null,
    category: 'CARNIVORE',
    weight: null,
    length: null,
    ...partial,
  };
}

describe('isTrophySpecies', () => {
  it('reconnaît une espèce trophée, insensible à la casse', () => {
    expect(isTrophySpecies('Brochet')).toBe(true);
    expect(isTrophySpecies('BLACK BASS')).toBe(true);
    expect(isTrophySpecies('Truite fario')).toBe(true);
  });

  it('rejette une espèce non trophée', () => {
    expect(isTrophySpecies('Gardon')).toBe(false);
    expect(isTrophySpecies('Perche')).toBe(false);
  });
});

describe('aggregateRecentCatches', () => {
  it('renvoie un tableau vide pour aucune prise', () => {
    expect(aggregateRecentCatches([])).toEqual([]);
  });

  it('groupe les prises par espèce et compte', () => {
    const result = aggregateRecentCatches([
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-10T00:00:00.000Z' }),
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-12T00:00:00.000Z' }),
      row({ speciesId: 'roach', speciesName: 'Gardon', caughtAt: '2026-06-11T00:00:00.000Z' }),
    ]);

    expect(result).toHaveLength(2);
    const pike = result.find((r) => r.speciesId === 'pike');
    expect(pike?.count).toBe(2);
    expect(pike?.lastCaughtAt).toBe('2026-06-12T00:00:00.000Z');
    expect(pike?.isTrophy).toBe(true);
  });

  it('trie par récence (dernière prise) puis fréquence', () => {
    const result = aggregateRecentCatches([
      // Sandre : 1 prise, mais la plus récente.
      row({ speciesId: 'zander', speciesName: 'Sandre', caughtAt: '2026-06-15T00:00:00.000Z' }),
      // Brochet : 3 prises, plus ancienne.
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-01T00:00:00.000Z' }),
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-05T00:00:00.000Z' }),
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-10T00:00:00.000Z' }),
    ]);

    // Récence prime : Sandre (15 juin) avant Brochet (10 juin).
    expect(result.map((r) => r.speciesId)).toEqual(['zander', 'pike']);
  });

  it('départage par fréquence quand la récence est égale', () => {
    const result = aggregateRecentCatches([
      row({ speciesId: 'a', speciesName: 'Gardon', caughtAt: '2026-06-10T00:00:00.000Z' }),
      row({ speciesId: 'b', speciesName: 'Ablette', caughtAt: '2026-06-10T00:00:00.000Z' }),
      row({ speciesId: 'b', speciesName: 'Ablette', caughtAt: '2026-06-09T00:00:00.000Z' }),
    ]);

    // Même dernière prise (10 juin) → la plus fréquente d'abord.
    expect(result.map((r) => r.speciesId)).toEqual(['b', 'a']);
  });

  it('calcule les fourchettes de poids/taille en ignorant les null', () => {
    const result = aggregateRecentCatches([
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-01T00:00:00.000Z', weight: 2, length: 60 }),
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-02T00:00:00.000Z', weight: null, length: null }),
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-03T00:00:00.000Z', weight: 5, length: 80 }),
    ]);

    const pike = result[0];
    expect(pike.minWeight).toBe(2);
    expect(pike.maxWeight).toBe(5);
    expect(pike.minLength).toBe(60);
    expect(pike.maxLength).toBe(80);
  });

  it('laisse les fourchettes à null si aucune prise mesurée', () => {
    const result = aggregateRecentCatches([
      row({ speciesId: 'pike', speciesName: 'Brochet', caughtAt: '2026-06-01T00:00:00.000Z' }),
    ]);
    expect(result[0].minWeight).toBeNull();
    expect(result[0].maxWeight).toBeNull();
    expect(result[0].minLength).toBeNull();
    expect(result[0].maxLength).toBeNull();
  });
});

describe('sortSpeciesByTrophy', () => {
  it('place les espèces trophées en premier', () => {
    const sorted = sortSpeciesByTrophy([
      { name: 'Gardon', abundance: 'HIGH' },
      { name: 'Brochet', abundance: 'LOW' },
      { name: 'Perche', abundance: 'MODERATE' },
      { name: 'Sandre', abundance: 'RARE' },
    ]);
    // Trophées (Brochet, Sandre) avant non-trophées (Gardon, Perche).
    expect(sorted.slice(0, 2).map((s) => s.name).sort()).toEqual(['Brochet', 'Sandre']);
    expect(sorted.slice(2).map((s) => s.name).sort()).toEqual(['Gardon', 'Perche']);
  });

  it('départage par abondance décroissante à statut trophée égal', () => {
    const sorted = sortSpeciesByTrophy([
      { name: 'Gardon', abundance: 'LOW' },
      { name: 'Ablette', abundance: 'VERY_HIGH' },
    ]);
    // Aucune n'est trophée → la plus abondante d'abord.
    expect(sorted.map((s) => s.name)).toEqual(['Ablette', 'Gardon']);
  });

  it('ne mute pas le tableau source', () => {
    const input = [
      { name: 'Gardon', abundance: 'HIGH' },
      { name: 'Brochet', abundance: 'LOW' },
    ];
    const snapshot = [...input];
    sortSpeciesByTrophy(input);
    expect(input).toEqual(snapshot);
  });
});
