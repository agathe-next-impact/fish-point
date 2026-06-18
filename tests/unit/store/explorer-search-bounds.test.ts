import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/store/map.store';
import type { MapBounds } from '@/types/map';

/**
 * Flow critique de la synchro Explorer (P0 n°3) : carte et liste partagent UNE
 * seule zone de recherche committée. Un pan/zoom mémorise une zone « en attente »
 * sans re-fetch ; seule la validation (« Rechercher dans cette zone ») applique
 * la zone aux deux vues. Les filtres ne doivent jamais être réinitialisés.
 */
describe('store Explorer — zone de recherche partagée carte ↔ liste', () => {
  const ZONE_A: MapBounds = { north: 49, south: 48, east: 3, west: 2 };
  const ZONE_B: MapBounds = { north: 46, south: 45, east: 5, west: 4 };

  beforeEach(() => {
    useMapStore.setState({ committedBounds: null, pendingBounds: null });
    const { resetFilters, setExplorerView } = useMapStore.getState();
    resetFilters();
    setExplorerView('map');
  });

  it('le premier cadrage de la carte initialise la zone committée (pas de bouton)', () => {
    const { setPendingBounds } = useMapStore.getState();
    setPendingBounds(ZONE_A);

    const state = useMapStore.getState();
    // Aucune zone committée préalable → adoptée directement : pending === committed.
    expect(state.committedBounds).toEqual(ZONE_A);
    expect(state.pendingBounds).toEqual(ZONE_A);
  });

  it('un pan ultérieur met la zone en attente sans toucher la zone committée', () => {
    const { setPendingBounds } = useMapStore.getState();
    setPendingBounds(ZONE_A); // cadrage initial
    setPendingBounds(ZONE_B); // déplacement

    const state = useMapStore.getState();
    expect(state.committedBounds).toEqual(ZONE_A); // liste/carte inchangées
    expect(state.pendingBounds).toEqual(ZONE_B); // zone en attente déplacée
  });

  it('commit applique la zone en attente aux deux vues (pending → committed)', () => {
    const { setPendingBounds, commitBounds } = useMapStore.getState();
    setPendingBounds(ZONE_A);
    setPendingBounds(ZONE_B);

    commitBounds();

    expect(useMapStore.getState().committedBounds).toEqual(ZONE_B);
  });

  it('commit sans zone en attente est un no-op', () => {
    const { commitBounds } = useMapStore.getState();
    commitBounds();
    expect(useMapStore.getState().committedBounds).toBeNull();
  });

  it('la recherche par zone préserve les filtres actifs', () => {
    const { setFilters, setPendingBounds, commitBounds } = useMapStore.getState();
    setFilters({ species: ['pike'], minFishabilityScore: 60 });

    setPendingBounds(ZONE_A);
    setPendingBounds(ZONE_B);
    commitBounds();

    const state = useMapStore.getState();
    expect(state.committedBounds).toEqual(ZONE_B);
    expect(state.filters.species).toEqual(['pike']);
    expect(state.filters.minFishabilityScore).toBe(60);
  });
});
