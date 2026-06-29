import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/store/map.store';

/**
 * Flow critique de la fusion Explorer (P0 n°1) : la vue Liste/Carte est un état
 * du store, et basculer de vue ne doit PAS réinitialiser les filtres de recherche.
 */
describe('store Explorer — bascule de vue + persistance des filtres', () => {
  beforeEach(() => {
    const { setSelectedSpot, setExplorerView } = useMapStore.getState();
    setSelectedSpot(null);
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

  it('conserve la sélection de spot au changement de vue (état store non réinitialisé)', () => {
    // Depuis la sous-étape 4, l'état de filtres vit dans `gridFilters` (state React de
    // l'Explorer), plus dans le store. L'invariant store à protéger : basculer de vue ne
    // doit réinitialiser AUCUN autre slice — ici la sélection de marqueur.
    const { setSelectedSpot, setExplorerView } = useMapStore.getState();

    setSelectedSpot('spot-pike');
    setExplorerView('map');

    const stateAfterToggle = useMapStore.getState();
    expect(stateAfterToggle.explorerView).toBe('map');
    expect(stateAfterToggle.selectedSpotId).toBe('spot-pike');

    // Retour en liste : la sélection tient toujours.
    setExplorerView('list');
    expect(useMapStore.getState().selectedSpotId).toBe('spot-pike');
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
