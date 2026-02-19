export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const;

export const DEFAULT_CENTER = {
  latitude: 46.603354,
  longitude: 1.888334,
  zoom: 6,
} as const;

export const FRANCE_BOUNDS: [[number, number], [number, number]] = [
  [-5.56, 41.31],
  [9.66, 51.12],
];

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function calculateBounds(
  points: { latitude: number; longitude: number }[],
  padding = 0.01,
): { north: number; south: number; east: number; west: number } {
  if (points.length === 0) {
    return { north: 51.12, south: 41.31, east: 9.66, west: -5.56 };
  }

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);

  return {
    north: Math.max(...lats) + padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    west: Math.min(...lngs) - padding,
  };
}
