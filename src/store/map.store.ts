import { create } from 'zustand';
import type { MapViewport, MapLayer, ExplorerView, MapBounds } from '@/types/map';

interface MapState {
  viewport: MapViewport;
  selectedSpotId: string | null;
  activeLayers: MapLayer[];
  /** Vue active de l'écran Explorer (liste ou carte) — persiste au changement de vue. */
  explorerView: ExplorerView;
  /**
   * Zone de recherche validée : source de vérité partagée par la carte ET la liste.
   * Les deux vues affichent le même jeu de résultats borné par ces coordonnées.
   * `null` = aucune zone committée (la liste retombe sur ses filtres globaux).
   */
  committedBounds: MapBounds | null;
  /**
   * Zone survolée par la carte après un pan/zoom, en attente de validation.
   * Non encore appliquée : tant qu'elle diffère de `committedBounds`, le bouton
   * « Rechercher dans cette zone » est proposé. Jamais de re-fetch automatique.
   */
  pendingBounds: MapBounds | null;
  setViewport: (viewport: Partial<MapViewport>) => void;
  setSelectedSpot: (spotId: string | null) => void;
  toggleLayer: (layer: MapLayer) => void;
  setExplorerView: (view: ExplorerView) => void;
  /** Mémorise la zone survolée (pan/zoom) sans déclencher de recherche. */
  setPendingBounds: (bounds: MapBounds) => void;
  /** Valide la zone en attente : elle devient la zone committée (carte + liste). */
  commitBounds: () => void;
  /**
   * Relâche le bornage géographique de la liste : la zone committée ET la zone en
   * attente retombent à `null`, la liste redevient nationale (filtres globaux).
   * Utilisé par l'état « 0 spot » pour proposer « Élargir la zone » sans nouvelle route.
   */
  clearCommittedBounds: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    latitude: 46.603354,
    longitude: 1.888334,
    zoom: 6,
  },
  selectedSpotId: null,
  activeLayers: ['spots'],
  explorerView: 'list',
  committedBounds: null,
  pendingBounds: null,

  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  setSelectedSpot: (spotId) => set({ selectedSpotId: spotId }),

  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layer)
        ? state.activeLayers.filter((l) => l !== layer)
        : [...state.activeLayers, layer],
    })),

  setExplorerView: (view) => set({ explorerView: view }),

  setPendingBounds: (bounds) =>
    set((state) => {
      // Premier cadrage de la carte (aucune zone committée) : on adopte la zone
      // directement comme committée pour que la liste démarre bornée et qu'aucun
      // bouton « Rechercher dans cette zone » ne s'affiche avant tout déplacement.
      if (state.committedBounds === null) {
        return { pendingBounds: bounds, committedBounds: bounds };
      }
      return { pendingBounds: bounds };
    }),

  commitBounds: () =>
    set((state) =>
      state.pendingBounds === null
        ? {}
        : { committedBounds: state.pendingBounds },
    ),

  clearCommittedBounds: () => set({ committedBounds: null, pendingBounds: null }),
}));
