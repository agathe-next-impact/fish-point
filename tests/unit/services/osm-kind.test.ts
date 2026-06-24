import { describe, it, expect } from 'vitest';
import { inferKindFromTags } from '@/lib/osm-kind';

/**
 * Modèle 3 niveaux : la classification OSM doit poser ACCESS_ZONE pour les
 * infrastructures d'accès (jetée, mise à l'eau, parking, cale, point d'accès) et
 * WATER_BODY pour tout le reste (plans d'eau, zones de pêche, tags vides).
 */
describe('inferKindFromTags', () => {
  it('man_made=pier → ACCESS_ZONE', () => {
    expect(inferKindFromTags({ man_made: 'pier' })).toBe('ACCESS_ZONE');
  });

  it('man_made=breakwater → ACCESS_ZONE', () => {
    expect(inferKindFromTags({ man_made: 'breakwater' })).toBe('ACCESS_ZONE');
  });

  it('leisure=slipway → ACCESS_ZONE', () => {
    expect(inferKindFromTags({ leisure: 'slipway' })).toBe('ACCESS_ZONE');
  });

  it('amenity=parking → ACCESS_ZONE', () => {
    expect(inferKindFromTags({ amenity: 'parking' })).toBe('ACCESS_ZONE');
  });

  it('amenity=boat_ramp → ACCESS_ZONE', () => {
    expect(inferKindFromTags({ amenity: 'boat_ramp' })).toBe('ACCESS_ZONE');
  });

  it('waterway=access_point → ACCESS_ZONE', () => {
    expect(inferKindFromTags({ waterway: 'access_point' })).toBe('ACCESS_ZONE');
  });

  it('plan d’eau (water=lake) → WATER_BODY', () => {
    expect(inferKindFromTags({ water: 'lake' })).toBe('WATER_BODY');
  });

  it('zone de pêche (leisure=fishing) → WATER_BODY', () => {
    expect(inferKindFromTags({ leisure: 'fishing' })).toBe('WATER_BODY');
  });

  it('tags vides → WATER_BODY (défaut)', () => {
    expect(inferKindFromTags({})).toBe('WATER_BODY');
  });
});
