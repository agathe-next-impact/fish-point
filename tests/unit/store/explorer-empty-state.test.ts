import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/store/map.store';
import type { MapBounds } from '@/types/map';

/**
 * Flow critique de l'état « 0 spot » (P0 n°2) : la sortie « Élargir la zone »
 * relâche le bornage géographique de la liste sans nouvelle route ni reset des
 * filtres. `clearCommittedBounds` ramène committed ET pending à `null` → la liste
 * redevient nationale (filtres globaux conservés).
 */
describe('store Explorer — relâche de zone depuis l’état 0 spot', () => {
  const ZONE: MapBounds = { north: 49, south: 48, east: 3, west: 2 };

  beforeEach(() => {
    useMapStore.setState({ committedBounds: null, pendingBounds: null });
    useMapStore.getState().resetFilters();
  });

  it('clearCommittedBounds relâche committed ET pending → liste nationale', () => {
    const { setPendingBounds, clearCommittedBounds } = useMapStore.getState();
    // Cadrage initial : committed = pending = ZONE (cf. setPendingBounds).
    setPendingBounds(ZONE);
    expect(useMapStore.getState().committedBounds).toEqual(ZONE);

    clearCommittedBounds();

    const state = useMapStore.getState();
    expect(state.committedBounds).toBeNull();
    expect(state.pendingBounds).toBeNull();
  });

  it('élargir la zone ne réinitialise pas les filtres actifs', () => {
    const { setFilters, setPendingBounds, clearCommittedBounds } = useMapStore.getState();
    setFilters({ species: ['pike'], minFishabilityScore: 60 });
    setPendingBounds(ZONE);

    clearCommittedBounds();

    const state = useMapStore.getState();
    expect(state.committedBounds).toBeNull();
    expect(state.filters.species).toEqual(['pike']);
    expect(state.filters.minFishabilityScore).toBe(60);
  });

  it('après relâche, un nouveau cadrage re-borne la liste (premier cadrage adopté)', () => {
    const { setPendingBounds, clearCommittedBounds } = useMapStore.getState();
    setPendingBounds(ZONE);
    clearCommittedBounds();
    expect(useMapStore.getState().committedBounds).toBeNull();

    // committedBounds === null → le cadrage suivant est adopté d'office.
    setPendingBounds(ZONE);
    expect(useMapStore.getState().committedBounds).toEqual(ZONE);
  });
});
