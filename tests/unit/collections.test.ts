import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LIST_NAME,
  DEFAULT_LIST_LABEL,
  MAX_LIST_NAME_LENGTH,
  normalizeListName,
  listNameLabel,
  deriveCollections,
} from '@/lib/collections';

describe('normalizeListName', () => {
  it('trim et compacte les espaces internes', () => {
    expect(normalizeListName('  Sortie   de   samedi  ')).toBe('Sortie de samedi');
  });

  it('retombe sur le défaut si la saisie est vide après nettoyage', () => {
    expect(normalizeListName('   ')).toBe(DEFAULT_LIST_NAME);
    expect(normalizeListName('')).toBe(DEFAULT_LIST_NAME);
  });

  it('tronque à la longueur max', () => {
    const long = 'a'.repeat(MAX_LIST_NAME_LENGTH + 20);
    expect(normalizeListName(long)).toHaveLength(MAX_LIST_NAME_LENGTH);
  });

  it('préserve un nom de collection valide', () => {
    expect(normalizeListName('Brochets du Rhône')).toBe('Brochets du Rhône');
  });
});

describe('listNameLabel', () => {
  it('mappe le défaut sur son libellé produit', () => {
    expect(listNameLabel(DEFAULT_LIST_NAME)).toBe(DEFAULT_LIST_LABEL);
  });

  it('mappe les collections suggérées sur leur libellé', () => {
    expect(listNameLabel('a-tester')).toBe('À tester');
    expect(listNameLabel('sortie-samedi')).toBe('Sortie de samedi');
  });

  it('renvoie le listName tel quel pour une collection libre', () => {
    expect(listNameLabel('Brochets du Rhône')).toBe('Brochets du Rhône');
  });
});

describe('deriveCollections', () => {
  it('dérive les collections distinctes avec leur effectif', () => {
    const result = deriveCollections([
      { listName: DEFAULT_LIST_NAME },
      { listName: DEFAULT_LIST_NAME },
      { listName: 'a-tester' },
    ]);

    expect(result).toEqual([
      { listName: DEFAULT_LIST_NAME, label: DEFAULT_LIST_LABEL, count: 2 },
      { listName: 'a-tester', label: 'À tester', count: 1 },
    ]);
  });

  it('place toujours la collection par défaut en premier', () => {
    const result = deriveCollections([
      { listName: 'a-tester' },
      { listName: 'a-tester' },
      { listName: 'a-tester' },
      { listName: DEFAULT_LIST_NAME },
    ]);

    expect(result[0]?.listName).toBe(DEFAULT_LIST_NAME);
  });

  it('trie les collections non-défaut par effectif décroissant', () => {
    const result = deriveCollections([
      { listName: 'rares' },
      { listName: 'frequents' },
      { listName: 'frequents' },
      { listName: 'frequents' },
    ]);

    expect(result.map((c) => c.listName)).toEqual(['frequents', 'rares']);
  });

  it('départage à effectif égal par ordre alphabétique du libellé (locale fr)', () => {
    const result = deriveCollections([{ listName: 'zander' }, { listName: 'anguille' }]);
    expect(result.map((c) => c.listName)).toEqual(['anguille', 'zander']);
  });

  it('retombe sur le défaut pour un listName absent, vide ou null', () => {
    const result = deriveCollections([{}, { listName: '' }, { listName: null }]);
    expect(result).toEqual([
      { listName: DEFAULT_LIST_NAME, label: DEFAULT_LIST_LABEL, count: 3 },
    ]);
  });

  it('renvoie une liste vide sans favori', () => {
    expect(deriveCollections([])).toEqual([]);
  });
});
