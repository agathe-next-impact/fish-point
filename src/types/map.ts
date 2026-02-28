export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type MapLayer = 'spots' | 'heatmap' | 'regulations' | 'satellite' | 'fishability';

export interface MapFiltersState {
  radius: number;
  waterTypes: string[];
  fishingTypes: string[];
  species: string[];
  minRating: number;
  minFishabilityScore: number;
  showAutoDiscovered: boolean;
  pmr: boolean;
  nightFishing: boolean;
  premiumOnly: boolean;
}
