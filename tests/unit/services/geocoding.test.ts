import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocode, reverseGeocode } from '@/services/geocoding.service';

const PARIS_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.347, 48.859] },
  properties: {
    label: 'Paris',
    score: 0.97,
    id: '75056',
    type: 'municipality',
    name: 'Paris',
    postcode: '75001',
    citycode: '75056',
    city: 'Paris',
    context: '75, Paris, Île-de-France',
    depcode: '75',
  },
};

const banResponse = (features: unknown[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ type: 'FeatureCollection', features }),
});

describe('geocoding.service (BAN)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('geocode', () => {
    it('maps a BAN search response to GeocodingResult[]', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(banResponse([PARIS_FEATURE]) as Response);

      const results = await geocode('Paris');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        placeName: 'Paris',
        commune: 'Paris',
        department: 'Paris',
        departmentCode: '75',
        region: 'Île-de-France',
        latitude: 48.859,
        longitude: 2.347,
      });
    });

    it('hits the BAN endpoint with the query encoded and a municipality filter', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(banResponse([]) as Response);

      await geocode('Saint-Étienne');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api-adresse.data.gouv.fr/search/?q=Saint-%C3%89tienne'),
      );
      expect(vi.mocked(fetch).mock.calls[0][0]).toContain('type=municipality');
    });

    it('returns [] on empty query without hitting the network', async () => {
      const results = await geocode('   ');

      expect(results).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns [] on non-OK response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);

      const results = await geocode('Paris');

      expect(results).toEqual([]);
    });

    it('returns [] on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'));

      const results = await geocode('Paris');

      expect(results).toEqual([]);
    });
  });

  describe('reverseGeocode', () => {
    it('maps a BAN reverse response to GeocodingResult', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(banResponse([PARIS_FEATURE]) as Response);

      const result = await reverseGeocode(48.8566, 2.3522);

      expect(result).not.toBeNull();
      expect(result?.commune).toBe('Paris');
      expect(result?.departmentCode).toBe('75');
      expect(result?.region).toBe('Île-de-France');
    });

    it('passes lon/lat correctly to the reverse endpoint', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(banResponse([]) as Response);

      await reverseGeocode(48.8566, 2.3522);

      const url = String(vi.mocked(fetch).mock.calls[0][0]);
      expect(url).toContain('lon=2.3522');
      expect(url).toContain('lat=48.8566');
    });

    it('returns null when BAN returns no features', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(banResponse([]) as Response);

      const result = await reverseGeocode(0, 0);

      expect(result).toBeNull();
    });

    it('handles missing context field gracefully', async () => {
      const minimal = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2.347, 48.859] },
        properties: { label: 'Paris', city: 'Paris', depcode: '75' },
      };
      vi.mocked(fetch).mockResolvedValueOnce(banResponse([minimal]) as Response);

      const result = await reverseGeocode(48.859, 2.347);

      expect(result).toEqual({
        placeName: 'Paris',
        commune: 'Paris',
        department: null,
        departmentCode: '75',
        region: null,
        latitude: 48.859,
        longitude: 2.347,
      });
    });
  });
});
