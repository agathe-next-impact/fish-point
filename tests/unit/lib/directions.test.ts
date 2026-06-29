import { describe, expect, it } from 'vitest';
import { buildDirectionsUrl } from '@/lib/directions';

describe('buildDirectionsUrl', () => {
  it('construit une URL Google Maps Directions universelle (api=1)', () => {
    const url = buildDirectionsUrl(45.8992, 6.1294); // Lac d'Annecy
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=45.8992%2C6.1294',
    );
  });

  it('encode la virgule entre lat et lng (compat mobile + desktop)', () => {
    const url = buildDirectionsUrl(48.8566, 2.3522);
    expect(url).toContain('destination=48.8566%2C2.3522');
    // api=1 → ouvre l'app native sur mobile, maps.google.com sur desktop
    expect(url).toContain('api=1');
  });

  it('accepte les coordonnées négatives (hémisphère sud / ouest)', () => {
    const url = buildDirectionsUrl(-33.8688, -70.1234);
    expect(url).toContain('destination=-33.8688%2C-70.1234');
  });

  it('rejette une latitude hors plage', () => {
    expect(() => buildDirectionsUrl(91, 0)).toThrow(RangeError);
  });

  it('rejette une longitude hors plage', () => {
    expect(() => buildDirectionsUrl(0, 181)).toThrow(RangeError);
  });

  it('rejette des coordonnées non finies (NaN)', () => {
    expect(() => buildDirectionsUrl(Number.NaN, 0)).toThrow(RangeError);
  });
});
