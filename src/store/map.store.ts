import { create } from 'zustand';
import type { MapViewport, MapLayer, MapFiltersState } from '@/types/map';

interface MapState {
  viewport: MapViewport;
  selectedSpotId: string | null;
  activeLayers: MapLayer[];
  filters: MapFiltersState;
  isFiltersOpen: boolean;
  setViewport: (viewport: Partial<MapViewport>) => void;
  setSelectedSpot: (spotId: string | null) => void;
  toggleLayer: (layer: MapLayer) => void;
  setFilters: (filters: Partial<MapFiltersState>) => void;
  resetFilters: () => void;
  setFiltersOpen: (open: boolean) => void;
}

const DEFAULT_FILTERS: MapFiltersState = {
  radius: 10000,
  waterTypes: [],
  fishingTypes: [],
  species: [],
  minRating: 0,
  pmr: false,
  nightFishing: false,
  premiumOnly: false,
};

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    latitude: 46.603354,
    longitude: 1.888334,
    zoom: 6,
  },
  selectedSpotId: null,
  activeLayers: ['spots'],
  filters: DEFAULT_FILTERS,
  isFiltersOpen: false,

  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  setSelectedSpot: (spotId) => set({ selectedSpotId: spotId }),

  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layer)
        ? state.activeLayers.filter((l) => l !== layer)
        : [...state.activeLayers, layer],
    })),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setFiltersOpen: (open) => set({ isFiltersOpen: open }),
}));
