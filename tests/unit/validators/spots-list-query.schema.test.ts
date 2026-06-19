import { describe, it, expect } from 'vitest';
import {
  spotsListQuerySchema,
  toSpotQueryFilters,
} from '@/validators/spot.schema';

/**
 * Couvre la centralisation du schéma de query liste Explorer (convergence des
 * filtres, sous-étape 3). Le schéma déplacé depuis `route.ts` doit conserver
 * exactement les mêmes règles : valeurs par défaut, coercition numérique/booléenne,
 * rejets 400 sur enum inconnu ou nombre hors borne. Le mapping vers `SpotQueryFilters`
 * est iso-fonctionnel (arrays vides → `undefined`).
 */
describe('spotsListQuerySchema', () => {
  it('applies defaults on an empty query', () => {
    const result = spotsListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
    expect(result.data.waterType).toEqual([]);
    expect(result.data.fishCategory).toEqual([]);
    expect(result.data.species).toEqual([]);
    expect(result.data.fishingMode).toEqual([]);
    expect(result.data.fishingTechnique).toEqual([]);
    expect(result.data.department).toBeUndefined();
    expect(result.data.parking).toBeUndefined();
  });

  it('parses a full valid query with coercion', () => {
    const result = spotsListQuerySchema.safeParse({
      page: '2',
      limit: '50',
      department: '74',
      waterType: ['LAKE', 'RIVER'],
      waterCategory: 'FIRST',
      fishCategory: ['CARNIVORE'],
      accessType: 'FREE',
      search: 'annecy',
      minRating: '3.5',
      minFishabilityScore: '40',
      maxFishabilityScore: '90',
      species: ['esox-lucius'],
      fishingMode: ['SHORE', 'BOAT'],
      fishingTechnique: ['SPINNING'],
      parking: 'true',
      boatLaunch: 'false',
      pmr: 'true',
      nightFishing: 'true',
      lat: '46.5',
      lng: '2.3',
      radius: '5000',
      north: '47',
      south: '46',
      east: '3',
      west: '2',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const q = result.data;
    expect(q.page).toBe(2);
    expect(q.limit).toBe(50);
    expect(q.department).toBe('74');
    expect(q.waterType).toEqual(['LAKE', 'RIVER']);
    expect(q.waterCategory).toBe('FIRST');
    expect(q.fishCategory).toEqual(['CARNIVORE']);
    expect(q.accessType).toBe('FREE');
    expect(q.search).toBe('annecy');
    expect(q.minRating).toBe(3.5);
    expect(q.minFishabilityScore).toBe(40);
    expect(q.maxFishabilityScore).toBe(90);
    expect(q.species).toEqual(['esox-lucius']);
    expect(q.fishingMode).toEqual(['SHORE', 'BOAT']);
    expect(q.fishingTechnique).toEqual(['SPINNING']);
    expect(q.parking).toBe(true);
    expect(q.boatLaunch).toBe(false);
    expect(q.pmr).toBe(true);
    expect(q.nightFishing).toBe(true);
    expect(q.lat).toBe(46.5);
    expect(q.lng).toBe(2.3);
    expect(q.radius).toBe(5000);
    expect(q.north).toBe(47);
    expect(q.south).toBe(46);
    expect(q.east).toBe(3);
    expect(q.west).toBe(2);
  });

  it('rejects an unknown waterType enum value', () => {
    const result = spotsListQuerySchema.safeParse({ waterType: ['OCEAN'] });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown fishingMode enum value', () => {
    const result = spotsListQuerySchema.safeParse({ fishingMode: ['UNKNOWN'] });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown accessType enum value', () => {
    const result = spotsListQuerySchema.safeParse({ accessType: 'NOPE' });
    expect(result.success).toBe(false);
  });

  it('rejects page below the minimum', () => {
    const result = spotsListQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects limit above the maximum', () => {
    const result = spotsListQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects minRating out of range', () => {
    const result = spotsListQuerySchema.safeParse({ minRating: '6' });
    expect(result.success).toBe(false);
  });

  it('rejects radius below the minimum', () => {
    const result = spotsListQuerySchema.safeParse({ radius: '50' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty department (min length 1)', () => {
    const result = spotsListQuerySchema.safeParse({ department: '' });
    expect(result.success).toBe(false);
  });
});

describe('toSpotQueryFilters', () => {
  it('maps empty arrays to undefined and omits geo/pagination concerns', () => {
    const q = spotsListQuerySchema.parse({});
    const filters = toSpotQueryFilters(q);
    expect(filters.waterType).toBeUndefined();
    expect(filters.fishCategory).toBeUndefined();
    expect(filters.species).toBeUndefined();
    expect(filters.fishingMode).toBeUndefined();
    expect(filters.fishingTechnique).toBeUndefined();
    // Geo + pagination are NOT part of the canonical filters.
    expect('page' in filters).toBe(false);
    expect('limit' in filters).toBe(false);
    expect('north' in filters).toBe(false);
    expect('lat' in filters).toBe(false);
  });

  it('forwards populated filters verbatim', () => {
    const q = spotsListQuerySchema.parse({
      department: '74',
      waterType: ['LAKE'],
      fishCategory: ['CARNIVORE'],
      species: ['esox-lucius'],
      fishingMode: ['SHORE'],
      fishingTechnique: ['SPINNING'],
      waterCategory: 'FIRST',
      accessType: 'FREE',
      search: 'annecy',
      minRating: '4',
      parking: 'true',
    });
    const filters = toSpotQueryFilters(q);
    expect(filters.department).toBe('74');
    expect(filters.waterType).toEqual(['LAKE']);
    expect(filters.fishCategory).toEqual(['CARNIVORE']);
    expect(filters.species).toEqual(['esox-lucius']);
    expect(filters.fishingMode).toEqual(['SHORE']);
    expect(filters.fishingTechnique).toEqual(['SPINNING']);
    expect(filters.waterCategory).toBe('FIRST');
    expect(filters.accessType).toBe('FREE');
    expect(filters.search).toBe('annecy');
    expect(filters.minRating).toBe(4);
    expect(filters.parking).toBe(true);
  });
});
