import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/store/map.store';

/**
 * Flow critique de la fusion Explorer (P0 n°1) : la vue Liste/Carte est un état
 * du store, et basculer de vue ne doit PAS réinitialiser les filtres de recherche.
 */
describe('store Explorer — bascule de vue + persistance des filtres', () => {
  beforeEach(() => {
    const { resetFilters, setExplorerView } = useMapStore.getState();
    resetFilters();
    setExplorerView('list');
  });

  it('démarre en vue liste par défaut', () => {
    expect(useMapStore.getState().explorerView).toBe('list');
  });

  it('bascule liste → carte → liste', () => {
    const { setExplorerView } = useMapStore.getState();

    setExplorerView('map');
    expect(useMapStore.getState().explorerView).toBe('map');

    setExplorerView('list');
    expect(useMapStore.getState().explorerView).toBe('list');
  });

  it('conserve les filtres au changement de vue', () => {
    const { setFilters, setExplorerView } = useMapStore.getState();

    setFilters({ species: ['pike'], minFishabilityScore: 60 });
    setExplorerView('map');

    const stateAfterToggle = useMapStore.getState();
    expect(stateAfterToggle.explorerView).toBe('map');
    expect(stateAfterToggle.filters.species).toEqual(['pike']);
    expect(stateAfterToggle.filters.minFishabilityScore).toBe(60);

    // Retour en liste : les filtres tiennent toujours.
    setExplorerView('list');
    const stateBack = useMapStore.getState();
    expect(stateBack.filters.species).toEqual(['pike']);
    expect(stateBack.filters.minFishabilityScore).toBe(60);
  });

  it('ne touche pas à la sélection ni au viewport en changeant de vue', () => {
    const { setSelectedSpot, setViewport, setExplorerView } = useMapStore.getState();

    setSelectedSpot('spot-123');
    setViewport({ zoom: 12 });
    setExplorerView('map');

    const state = useMapStore.getState();
    expect(state.selectedSpotId).toBe('spot-123');
    expect(state.viewport.zoom).toBe(12);
  });
});
