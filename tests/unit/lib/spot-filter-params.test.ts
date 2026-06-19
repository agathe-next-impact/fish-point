import { describe, it, expect } from 'vitest';
import {
  serializeSpotFilters,
  parseSpotFilterParams,
  splitFishingTypes,
  activeAccessibilityFlags,
  type SpotQueryFilters,
} from '@/lib/spot-filter-params';

describe('serializeSpotFilters', () => {
  it('sérialise les listes en params répétés (getAll côté serveur)', () => {
    const params = serializeSpotFilters({
      waterType: ['LAKE', 'RIVER'],
      species: ['esox-1', 'sander-2'],
      fishingMode: ['SHORE'],
      fishingTechnique: ['SPINNING', 'FLY'],
      fishCategory: ['CARNIVORE'],
    });
    expect(params.getAll('waterType')).toEqual(['LAKE', 'RIVER']);
    expect(params.getAll('species')).toEqual(['esox-1', 'sander-2']);
    expect(params.getAll('fishingMode')).toEqual(['SHORE']);
    expect(params.getAll('fishingTechnique')).toEqual(['SPINNING', 'FLY']);
    expect(params.getAll('fishCategory')).toEqual(['CARNIVORE']);
  });

  it('omet les valeurs vides, undefined et les flags false', () => {
    const params = serializeSpotFilters({
      waterType: [],
      species: undefined,
      search: '',
      department: undefined,
      parking: false,
      pmr: undefined,
      minFishabilityScore: 0,
    });
    expect([...params.keys()]).toHaveLength(0);
  });

  it('sérialise les scalaires et les flags actifs', () => {
    const params = serializeSpotFilters({
      search: 'annecy',
      department: '74',
      waterCategory: 'FIRST',
      accessType: 'FREE',
      minRating: 4,
      minFishabilityScore: 60,
      maxFishabilityScore: 100,
      parking: true,
      boatLaunch: true,
      pmr: false,
      nightFishing: true,
    });
    expect(params.get('search')).toBe('annecy');
    expect(params.get('department')).toBe('74');
    expect(params.get('waterCategory')).toBe('FIRST');
    expect(params.get('accessType')).toBe('FREE');
    expect(params.get('minRating')).toBe('4');
    expect(params.get('minFishabilityScore')).toBe('60');
    expect(params.get('maxFishabilityScore')).toBe('100');
    expect(params.get('parking')).toBe('true');
    expect(params.get('boatLaunch')).toBe('true');
    expect(params.get('nightFishing')).toBe('true');
    // pmr false → absent
    expect(params.get('pmr')).toBeNull();
  });

  it('omet un score à 0 (pas de contrainte appliquée)', () => {
    const params = serializeSpotFilters({ minFishabilityScore: 0, maxFishabilityScore: 0 });
    expect(params.get('minFishabilityScore')).toBeNull();
    expect(params.get('maxFishabilityScore')).toBeNull();
  });
});

describe('parseSpotFilterParams', () => {
  it('désérialise les listes via getAll et ignore les valeurs vides', () => {
    const params = new URLSearchParams();
    params.append('waterType', 'LAKE');
    params.append('waterType', '');
    params.append('species', 'esox-1');
    const parsed = parseSpotFilterParams(params);
    expect(parsed.waterType).toEqual(['LAKE']);
    expect(parsed.species).toEqual(['esox-1']);
  });

  it('filtre mode/technique sur les ensembles connus (anti-injection de valeurs arbitraires)', () => {
    const params = new URLSearchParams();
    params.append('fishingMode', 'SHORE');
    params.append('fishingMode', 'NOT_A_MODE');
    params.append('fishingTechnique', 'FLY');
    params.append('fishingTechnique', 'SHORE'); // SHORE est un mode, pas une technique
    const parsed = parseSpotFilterParams(params);
    expect(parsed.fishingMode).toEqual(['SHORE']);
    expect(parsed.fishingTechnique).toEqual(['FLY']);
  });

  it('absence de liste → undefined (pas de tableau vide qui fausserait un .length > 0)', () => {
    const parsed = parseSpotFilterParams(new URLSearchParams());
    expect(parsed.waterType).toBeUndefined();
    expect(parsed.species).toBeUndefined();
    expect(parsed.fishingMode).toBeUndefined();
    expect(parsed.fishCategory).toBeUndefined();
  });

  it('parse les nombres et ignore les valeurs non numériques', () => {
    const params = new URLSearchParams({ minRating: '4', minFishabilityScore: 'abc' });
    const parsed = parseSpotFilterParams(params);
    expect(parsed.minRating).toBe(4);
    expect(parsed.minFishabilityScore).toBeUndefined();
  });

  it("parse les flags d'accès : 'true' → true, absent → undefined", () => {
    const params = new URLSearchParams({ parking: 'true', pmr: 'false' });
    const parsed = parseSpotFilterParams(params);
    expect(parsed.parking).toBe(true);
    expect(parsed.pmr).toBeUndefined();
    expect(parsed.boatLaunch).toBeUndefined();
  });
});

describe('round-trip serialize → parse (liste et carte parlent le même vocabulaire)', () => {
  it('préserve un jeu de filtres « sortie » complet', () => {
    const filters: SpotQueryFilters = {
      waterType: ['LAKE'],
      waterCategory: 'FIRST',
      fishCategory: ['CARNIVORE'],
      accessType: 'FREE',
      search: 'lac',
      department: '74',
      minRating: 3,
      minFishabilityScore: 50,
      maxFishabilityScore: 90,
      species: ['esox-1'],
      fishingMode: ['SHORE'],
      fishingTechnique: ['SPINNING'],
      parking: true,
      boatLaunch: true,
      pmr: true,
      nightFishing: true,
    };
    const reparsed = parseSpotFilterParams(serializeSpotFilters(filters));
    expect(reparsed).toEqual(filters);
  });
});

describe('helpers WHERE partagés', () => {
  it('splitFishingTypes répartit modes et techniques en écartant les inconnus', () => {
    const { modes, techniques } = splitFishingTypes({
      fishingMode: ['SHORE', 'BOAT', 'NOPE'],
      fishingTechnique: ['FLY', 'SHORE'],
    });
    expect(modes).toEqual(['SHORE', 'BOAT']);
    expect(techniques).toEqual(['FLY']);
  });

  it('activeAccessibilityFlags retourne uniquement les flags à true, dans un ordre stable', () => {
    expect(
      activeAccessibilityFlags({ parking: true, pmr: true, boatLaunch: false }),
    ).toEqual(['parking', 'pmr']);
    expect(activeAccessibilityFlags({})).toEqual([]);
  });
});
