'use client';

import { Source, Layer } from 'react-map-gl/mapbox';

interface RouteLayerProps {
  coordinates: [number, number][];
}

export function RouteLayer({ coordinates }: RouteLayerProps) {
  if (coordinates.length < 2) return null;

  const geojson = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates,
    },
  };

  return (
    <Source type="geojson" data={geojson}>
      <Layer
        id="route-layer"
        type="line"
        paint={{
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </Source>
  );
}
