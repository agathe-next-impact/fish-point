import { describe, expect, it } from 'vitest';
import { DEFAULT_CENTER, savedSpotsCamera } from '@/lib/map';

const ANNECY = { latitude: 45.8992, longitude: 6.1294 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe('savedSpotsCamera', () => {
  it('0 spot → centre DEFAULT_CENTER (vue France)', () => {
    const cam = savedSpotsCamera([]);
    expect(cam).toEqual({
      kind: 'center',
      longitude: DEFAULT_CENTER.longitude,
      latitude: DEFAULT_CENTER.latitude,
      zoom: DEFAULT_CENTER.zoom,
    });
  });

  it('1 spot → centre sur le point avec un zoom rapproché (pas de bbox dégénérée)', () => {
    const cam = savedSpotsCamera([ANNECY]);
    expect(cam.kind).toBe('center');
    if (cam.kind !== 'center') throw new Error('attendu kind=center');
    expect(cam.latitude).toBe(ANNECY.latitude);
    expect(cam.longitude).toBe(ANNECY.longitude);
    expect(cam.zoom).toBeGreaterThan(DEFAULT_CENTER.zoom);
  });

  it('≥2 points distincts → enveloppe [[west, south], [east, north]] pour fitBounds', () => {
    const cam = savedSpotsCamera([PARIS, ANNECY]);
    expect(cam.kind).toBe('bounds');
    if (cam.kind !== 'bounds') throw new Error('attendu kind=bounds');
    const [[west, south], [east, north]] = cam.bounds;
    expect(west).toBe(Math.min(PARIS.longitude, ANNECY.longitude)); // 2.3522
    expect(east).toBe(Math.max(PARIS.longitude, ANNECY.longitude)); // 6.1294
    expect(south).toBe(Math.min(PARIS.latitude, ANNECY.latitude)); // 45.8992
    expect(north).toBe(Math.max(PARIS.latitude, ANNECY.latitude)); // 48.8566
    expect(west).toBeLessThan(east);
    expect(south).toBeLessThan(north);
  });

  it('plusieurs points TOUS confondus → traités comme 1 spot (centre + zoom), pas une bbox plate', () => {
    const cam = savedSpotsCamera([ANNECY, { ...ANNECY }, { ...ANNECY }]);
    expect(cam).toEqual({
      kind: 'center',
      longitude: ANNECY.longitude,
      latitude: ANNECY.latitude,
      zoom: expect.any(Number),
    });
  });

  it('ignore les coordonnées non finies (données partielles)', () => {
    const cam = savedSpotsCamera([
      ANNECY,
      { latitude: Number.NaN, longitude: 2 },
      { latitude: 3, longitude: Number.POSITIVE_INFINITY },
    ]);
    // Seul ANNECY est valide → centre sur lui, pas de bbox étirée par les NaN.
    expect(cam.kind).toBe('center');
    if (cam.kind !== 'center') throw new Error('attendu kind=center');
    expect(cam.latitude).toBe(ANNECY.latitude);
    expect(cam.longitude).toBe(ANNECY.longitude);
  });

  it('ne renvoie une bbox que pour des points valides distincts', () => {
    const cam = savedSpotsCamera([
      PARIS,
      { latitude: Number.NaN, longitude: Number.NaN },
      ANNECY,
    ]);
    expect(cam.kind).toBe('bounds');
  });
});
