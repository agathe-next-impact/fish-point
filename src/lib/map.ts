/**
 * MapLibre + Protomaps configuration.
 *
 * Tile source: PMTiles file hosted on Vercel Blob (URL via NEXT_PUBLIC_PMTILES_URL).
 * Setup runbook: docs/ops/pmtiles-vercel-blob-setup.md
 *
 * Style assembly (vector + satellite) is finalized in ML-06. For now we expose
 * the source URLs and a minimal Protomaps light theme so ML-03 can plug it in.
 */

import type { StyleSpecification } from 'maplibre-gl';
import themes, { labels as themeLabels } from 'protomaps-themes-base';

export const DEFAULT_CENTER = {
  latitude: 46.603354,
  longitude: 1.888334,
  zoom: 6,
} as const;

export const WESTERN_EUROPE_BOUNDS: [[number, number], [number, number]] = [
  [-10.62, 35.49],
  [18.52, 58.67],
];

export const FRANCE_BOUNDS: [[number, number], [number, number]] = [
  [-5.56, 41.31],
  [9.66, 51.12],
];

export const MAP_MAX_BOUNDS = WESTERN_EUROPE_BOUNDS;

export const PMTILES_URL = process.env.NEXT_PUBLIC_PMTILES_URL ?? '';
export const PMTILES_FILE = process.env.NEXT_PUBLIC_PMTILES_FILE ?? 'western-europe.pmtiles';

const PROTOMAPS_SOURCE_ID = 'protomaps';
const IGN_ORTHO_WMTS =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM' +
  '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg';

/**
 * Returns the URL passed to MapLibre as `mapStyle`.
 * MapLibre understands the `pmtiles://` scheme once the protocol is registered
 * via `addProtocol('pmtiles', new Protocol().tile)` at component mount.
 */
export function getPmtilesSourceUrl(): string {
  if (!PMTILES_URL) {
    throw new Error('NEXT_PUBLIC_PMTILES_URL is not set — see docs/ops/pmtiles-vercel-blob-setup.md');
  }
  return `pmtiles://${PMTILES_URL}/${PMTILES_FILE}`;
}

/**
 * Minimal vector style using a placeholder Protomaps light theme.
 * The final theme (custom colors, label layers) is built in ML-06.
 */
export function buildVectorStyle(themeLayers: StyleSpecification['layers']): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/light',
    sources: {
      [PROTOMAPS_SOURCE_ID]: {
        type: 'vector',
        url: getPmtilesSourceUrl(),
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: themeLayers,
  };
}

/**
 * Raster style for the satellite toggle, using IGN Géoplateforme orthophotos
 * with a Protomaps labels overlay on top so city/water/road names remain
 * readable over imagery. The hostname `data.geopf.fr` is whitelisted in
 * next.config.mjs.
 */
export function buildSatelliteStyle(): StyleSpecification {
  const labelLayers = themeLabels(PROTOMAPS_SOURCE_ID, 'white', 'fr') as unknown as StyleSpecification['layers'];
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/light',
    sources: {
      'ign-ortho': {
        type: 'raster',
        tiles: [IGN_ORTHO_WMTS],
        tileSize: 256,
        attribution: '© <a href="https://geoservices.ign.fr">IGN</a>',
        minzoom: 0,
        maxzoom: 19,
      },
      [PROTOMAPS_SOURCE_ID]: {
        type: 'vector',
        url: getPmtilesSourceUrl(),
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: [
      { id: 'ign-ortho-layer', type: 'raster', source: 'ign-ortho' },
      ...labelLayers,
    ],
  };
}

/**
 * Default vector style for the app — Protomaps light theme with French labels.
 * Pure JSON (no runtime maplibre dep), safe to call from server or client.
 *
 * The cast is safe: `protomaps-themes-base` returns LayerSpecification[] from
 * `@maplibre/maplibre-gl-style-spec`, which maplibre-gl re-exports. The runtime
 * shape is identical — only the TS module identity differs.
 */
export function getDefaultVectorStyle(): StyleSpecification {
  const layers = themes(PROTOMAPS_SOURCE_ID, 'light', 'fr') as unknown as StyleSpecification['layers'];
  return buildVectorStyle(layers);
}

export const MAP_STYLE_KEYS = {
  vector: 'vector',
  satellite: 'satellite',
} as const;

export type MapStyleKey = (typeof MAP_STYLE_KEYS)[keyof typeof MAP_STYLE_KEYS];

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
    return {
      north: MAP_MAX_BOUNDS[1][1],
      south: MAP_MAX_BOUNDS[0][1],
      east: MAP_MAX_BOUNDS[1][0],
      west: MAP_MAX_BOUNDS[0][0],
    };
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
