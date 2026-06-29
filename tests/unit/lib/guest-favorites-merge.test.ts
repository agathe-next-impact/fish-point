import { describe, expect, it, vi } from 'vitest';
import {
  mergeGuestFavorites,
  type GuestFavoriteRecord,
} from '@/lib/guest-favorites-merge';

const records: GuestFavoriteRecord[] = [
  { spotId: 'spot-a' },
  { spotId: 'spot-b' },
  { spotId: 'spot-c' },
];

describe('mergeGuestFavorites', () => {
  it('liste vide → no-op : aucun POST, aucun vidage du local', async () => {
    const postFavorite = vi.fn().mockResolvedValue(undefined);
    const clearLocal = vi.fn().mockResolvedValue(undefined);

    const result = await mergeGuestFavorites({ records: [], postFavorite, clearLocal });

    expect(result).toEqual({ merged: 0, failed: 0, cleared: false });
    expect(postFavorite).not.toHaveBeenCalled();
    expect(clearLocal).not.toHaveBeenCalled();
  });

  it('tous les POST réussissent → vide le local et compte les fusions', async () => {
    const postFavorite = vi.fn().mockResolvedValue(undefined);
    const clearLocal = vi.fn().mockResolvedValue(undefined);

    const result = await mergeGuestFavorites({ records, postFavorite, clearLocal });

    expect(result).toEqual({ merged: 3, failed: 0, cleared: true });
    expect(postFavorite).toHaveBeenCalledTimes(3);
    expect(clearLocal).toHaveBeenCalledTimes(1);
  });

  it('un POST échoue → NE vide PAS le local, comptabilise l’échec', async () => {
    const postFavorite = vi
      .fn()
      .mockResolvedValueOnce(undefined) // spot-a OK
      .mockRejectedValueOnce(new Error('500')) // spot-b KO
      .mockResolvedValueOnce(undefined); // spot-c OK
    const clearLocal = vi.fn().mockResolvedValue(undefined);

    const result = await mergeGuestFavorites({ records, postFavorite, clearLocal });

    expect(result).toEqual({ merged: 2, failed: 1, cleared: false });
    expect(postFavorite).toHaveBeenCalledTimes(3); // continue malgré l'échec
    expect(clearLocal).not.toHaveBeenCalled(); // local conservé → retry au prochain login
  });

  it('tous les POST échouent → rien n’est vidé, failed = total', async () => {
    const postFavorite = vi.fn().mockRejectedValue(new Error('offline'));
    const clearLocal = vi.fn().mockResolvedValue(undefined);

    const result = await mergeGuestFavorites({ records, postFavorite, clearLocal });

    expect(result).toEqual({ merged: 0, failed: 3, cleared: false });
    expect(clearLocal).not.toHaveBeenCalled();
  });
});
