import { describe, it, expect } from 'vitest';
import type { FishingType } from '@prisma/client';
import {
  classifyFishingType,
  FISHING_MODE_TYPES,
  FISHING_TECHNIQUE_TYPES,
  FISHING_MODE_OPTIONS,
  FISHING_TECHNIQUE_OPTIONS,
  fishingTypeLabel,
} from '@/lib/fishing-type-classification';

// Liste de référence figée sur l'enum Prisma `FishingType`. Si l'enum change,
// ce test casse volontairement pour forcer la mise à jour de la classification.
const ALL_FISHING_TYPES: FishingType[] = [
  'SPINNING',
  'FLY',
  'COARSE',
  'CARP',
  'SURFCASTING',
  'TROLLING',
  'FLOAT_TUBE',
  'BOAT',
  'SHORE',
];

describe('classifyFishingType', () => {
  it("classe SHORE / BOAT / FLOAT_TUBE comme 'mode'", () => {
    expect(classifyFishingType('SHORE')).toBe('mode');
    expect(classifyFishingType('BOAT')).toBe('mode');
    expect(classifyFishingType('FLOAT_TUBE')).toBe('mode');
  });

  it("classe les techniques de pêche comme 'technique'", () => {
    for (const t of ['SPINNING', 'FLY', 'COARSE', 'CARP', 'SURFCASTING', 'TROLLING'] as const) {
      expect(classifyFishingType(t)).toBe('technique');
    }
  });

  it('couvre exhaustivement et sans recouvrement tout l’enum FishingType', () => {
    const modes = new Set<string>(FISHING_MODE_TYPES);
    const techniques = new Set<string>(FISHING_TECHNIQUE_TYPES);

    // Partition stricte : chaque membre est dans exactement un sous-ensemble.
    for (const t of ALL_FISHING_TYPES) {
      const inMode = modes.has(t);
      const inTech = techniques.has(t);
      expect(inMode !== inTech).toBe(true);
      expect(classifyFishingType(t)).toBe(inMode ? 'mode' : 'technique');
    }

    // Aucun membre orphelin ni inventé.
    expect(modes.size + techniques.size).toBe(ALL_FISHING_TYPES.length);
  });
});

describe('options de filtres', () => {
  it('fournit des libellés FR pour le mode', () => {
    const shore = FISHING_MODE_OPTIONS.find((o) => o.value === 'SHORE');
    expect(shore?.label).toBe('Du bord');
    expect(FISHING_MODE_OPTIONS).toHaveLength(3);
  });

  it('fournit des libellés FR pour la technique', () => {
    const fly = FISHING_TECHNIQUE_OPTIONS.find((o) => o.value === 'FLY');
    expect(fly?.label).toBe('Mouche');
    expect(FISHING_TECHNIQUE_OPTIONS).toHaveLength(6);
  });

  it('fishingTypeLabel retombe sur la clé brute si inconnue', () => {
    expect(fishingTypeLabel('SPINNING')).toBe('Lancer');
  });
});
