import { describe, expect, it } from 'vitest';
import { haversineMeters, sortByDistance, type LatLng } from '@/lib/geo-distance';

const PARIS: LatLng = { latitude: 48.8566, longitude: 2.3522 };
const LYON: LatLng = { latitude: 45.7640, longitude: 4.8357 };

describe('haversineMeters', () => {
  it('renvoie 0 pour deux points identiques', () => {
    expect(haversineMeters(PARIS, PARIS)).toBe(0);
  });

  it('calcule une distance réaliste en mètres (Paris ↔ Lyon ≈ 392 km)', () => {
    const meters = haversineMeters(PARIS, LYON);
    // Distance orthodromique connue ~391,5 km : on tolère 1 % (sphère vs ellipsoïde).
    expect(meters).toBeGreaterThan(388_000);
    expect(meters).toBeLessThan(396_000);
  });

  it('est symétrique (A→B == B→A)', () => {
    expect(haversineMeters(PARIS, LYON)).toBeCloseTo(haversineMeters(LYON, PARIS), 6);
  });

  it('rejette des coordonnées non finies', () => {
    expect(() => haversineMeters(PARIS, { latitude: Number.NaN, longitude: 0 })).toThrow(RangeError);
  });

  it('rejette une latitude hors plage WGS84', () => {
    expect(() => haversineMeters(PARIS, { latitude: 91, longitude: 0 })).toThrow(RangeError);
  });

  it('rejette une longitude hors plage WGS84', () => {
    expect(() => haversineMeters(PARIS, { latitude: 0, longitude: 181 })).toThrow(RangeError);
  });
});

describe('sortByDistance', () => {
  const near: LatLng & { id: string } = { id: 'near', latitude: 48.86, longitude: 2.35 };
  const far: LatLng & { id: string } = { id: 'far', latitude: 45.76, longitude: 4.83 };

  it('trie du plus proche au plus lointain et renseigne distance (mètres)', () => {
    const sorted = sortByDistance([far, near], PARIS);
    expect(sorted.map((s) => s.id)).toEqual(['near', 'far']);
    expect(sorted[0].distance).toBeGreaterThanOrEqual(0);
    expect(sorted[0].distance!).toBeLessThan(sorted[1].distance!);
  });

  it('sans origine : conserve l’ordre d’entrée et n’ajoute pas de distance', () => {
    const result = sortByDistance([far, near], null);
    expect(result.map((s) => s.id)).toEqual(['far', 'near']);
    expect(result[0].distance).toBeUndefined();
  });

  it('ne mute pas le tableau ni les éléments source', () => {
    const input = [far, near];
    const sorted = sortByDistance(input, PARIS);
    expect(input).toEqual([far, near]); // ordre source intact
    expect(sorted[0]).not.toBe(near); // copie, pas la même référence
    expect('distance' in near).toBe(false); // source non mutée
  });
});
