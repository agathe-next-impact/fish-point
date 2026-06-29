import { describe, it, expect } from 'vitest';
import { inferWaterTypeFromTags } from '@/lib/osm-water-type';

/**
 * Mapping tags OSM → WaterType. Pur, sans I/O. Couvre les plans d'eau (polygones),
 * la correction du bug river→CANAL hérité, le support défensif des tags waterway, et
 * le défaut LAKE pour les zones de pêche / infrastructures d'accès sans type explicite.
 */
describe('inferWaterTypeFromTags', () => {
  it('water=lake → LAKE', () => {
    expect(inferWaterTypeFromTags({ water: 'lake' })).toBe('LAKE');
  });

  it('natural=water sans water → LAKE', () => {
    expect(inferWaterTypeFromTags({ natural: 'water' })).toBe('LAKE');
  });

  it('water=pond → POND', () => {
    expect(inferWaterTypeFromTags({ water: 'pond' })).toBe('POND');
  });

  it('water=basin → POND', () => {
    expect(inferWaterTypeFromTags({ water: 'basin' })).toBe('POND');
  });

  it('reservoir (water ou landuse) → LAKE (RESERVOIR évité)', () => {
    expect(inferWaterTypeFromTags({ water: 'reservoir' })).toBe('LAKE');
    expect(inferWaterTypeFromTags({ landuse: 'reservoir' })).toBe('LAKE');
  });

  it('water=river → RIVER (corrige le mapping river→CANAL hérité)', () => {
    expect(inferWaterTypeFromTags({ water: 'river' })).toBe('RIVER');
  });

  it('water=canal → CANAL', () => {
    expect(inferWaterTypeFromTags({ water: 'canal' })).toBe('CANAL');
  });

  it('coastline / water=sea → SEA', () => {
    expect(inferWaterTypeFromTags({ natural: 'coastline' })).toBe('SEA');
    expect(inferWaterTypeFromTags({ water: 'sea' })).toBe('SEA');
  });

  it('waterway=river / riverbank → RIVER (défensif)', () => {
    expect(inferWaterTypeFromTags({ waterway: 'river' })).toBe('RIVER');
    expect(inferWaterTypeFromTags({ waterway: 'riverbank' })).toBe('RIVER');
  });

  it('waterway=canal → CANAL (défensif)', () => {
    expect(inferWaterTypeFromTags({ waterway: 'canal' })).toBe('CANAL');
  });

  it('waterway=stream → STREAM (défensif)', () => {
    expect(inferWaterTypeFromTags({ waterway: 'stream' })).toBe('STREAM');
  });

  it('leisure=fishing sans type d’eau → LAKE (défaut)', () => {
    expect(inferWaterTypeFromTags({ leisure: 'fishing' })).toBe('LAKE');
    expect(inferWaterTypeFromTags({ fishing: 'yes' })).toBe('LAKE');
  });

  it('infrastructures d’accès (pier/breakwater/slipway) → LAKE (cosmétique, type porté par le parent)', () => {
    expect(inferWaterTypeFromTags({ man_made: 'pier' })).toBe('LAKE');
    expect(inferWaterTypeFromTags({ man_made: 'breakwater' })).toBe('LAKE');
    expect(inferWaterTypeFromTags({ leisure: 'slipway' })).toBe('LAKE');
  });

  it('tags vides → LAKE (défaut)', () => {
    expect(inferWaterTypeFromTags({})).toBe('LAKE');
  });
});
