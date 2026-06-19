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
  properties: Record<string, string | number | boolean | null>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type MapLayer = 'spots' | 'heatmap' | 'regulations' | 'satellite' | 'fishability' | 'privateSpots';

/** Vue active de l'écran Explorer : liste de résultats ou carte. */
export type ExplorerView = 'list' | 'map';
