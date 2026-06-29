import { describe, it, expect } from 'vitest';
import {
  createPrivateSpotSchema,
  updatePrivateSpotSchema,
} from '@/validators/private-spot.schema';

/**
 * Modèle 3 niveaux (slice 6) : le rattachement optionnel `spotId` d'un waypoint privé à
 * un plan d'eau public doit accepter l'absence (auto-résolution serveur), `null`
 * (dé-rattachement via PATCH) et une string, mais rejeter une string vide.
 */
describe('createPrivateSpotSchema — spotId', () => {
  const base = { name: 'Coin secret', latitude: 46.5, longitude: 2.3 };

  it('accepte un waypoint sans spotId (auto-résolution côté serveur)', () => {
    const r = createPrivateSpotSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spotId).toBeUndefined();
  });

  it('accepte spotId = null', () => {
    const r = createPrivateSpotSchema.safeParse({ ...base, spotId: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spotId).toBeNull();
  });

  it('accepte un spotId non vide', () => {
    const r = createPrivateSpotSchema.safeParse({ ...base, spotId: 'cmm4v5jr104xcm43cy6e3fhyo' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spotId).toBe('cmm4v5jr104xcm43cy6e3fhyo');
  });

  it('rejette un spotId vide', () => {
    const r = createPrivateSpotSchema.safeParse({ ...base, spotId: '' });
    expect(r.success).toBe(false);
  });

  it('updatePrivateSpotSchema (PATCH) accepte spotId = null pour dé-rattacher', () => {
    const r = updatePrivateSpotSchema.safeParse({ spotId: null });
    expect(r.success).toBe(true);
  });
});
