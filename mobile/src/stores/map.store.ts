import { create } from 'zustand';
import type { MapViewport, MapLayer, MapFiltersState } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_VIEWPORT: MapViewport = {
  latitude: 46.603354,
  longitude: 1.888334,
  zoom: 6,
};

const DEFAULT_FILTERS: MapFiltersState = {
  radius: 50,
  waterTypes: [],
  fishingTypes: [],
  species: [],
  minRating: 0,
  minFishabilityScore: 0,
  showAutoDiscovered: true,
  pmr: false,
  nightFishing: false,
  premiumOnly: false,
};

const DEFAULT_LAYERS: MapLayer[] = ['spots'];

// ---------------------------------------------------------------------------
// State & actions
// ---------------------------------------------------------------------------

interface MapState {
  viewport: MapViewport;
  selectedSpotId: string | null;
  activeLayers: MapLayer[];
  filters: MapFiltersState;
}

interface MapActions {
  setViewport: (viewport: Partial<MapViewport>) => void;
  selectSpot: (spotId: string | null) => void;
  toggleLayer: (layer: MapLayer) => void;
  updateFilters: (filters: Partial<MapFiltersState>) => void;
  resetFilters: () => void;
}

export type MapStore = MapState & MapActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMapStore = create<MapStore>((set) => ({
  // -- State ----------------------------------------------------------------
  viewport: DEFAULT_VIEWPORT,
  selectedSpotId: null,
  activeLayers: DEFAULT_LAYERS,
  filters: DEFAULT_FILTERS,

  // -- Actions --------------------------------------------------------------

  setViewport: (partial) =>
    set((state) => ({
      viewport: { ...state.viewport, ...partial },
    })),

  selectSpot: (spotId) => set({ selectedSpotId: spotId }),

  toggleLayer: (layer) =>
    set((state) => {
      const isActive = state.activeLayers.includes(layer);
      return {
        activeLayers: isActive
          ? state.activeLayers.filter((l) => l !== layer)
          : [...state.activeLayers, layer],
      };
    }),

  updateFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
