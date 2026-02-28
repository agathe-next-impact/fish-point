'use client';

import { Source, Layer } from 'react-map-gl/mapbox';
import { useMemo } from 'react';
import type { SpotListItem } from '@/types/spot';
import type { GeoJSONFeatureCollection } from '@/types/map';

interface FishabilityLayerProps {
  spots: SpotListItem[];
}

export function FishabilityLayer({ spots }: FishabilityLayerProps) {
  const geojson: GeoJSONFeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: spots
        .filter((spot) => spot.fishabilityScore != null)
        .map((spot) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [spot.longitude, spot.latitude],
          },
          properties: {
            weight: (spot.fishabilityScore ?? 0) / 100,
          },
        })),
    }),
    [spots],
  );

  return (
    <Source type="geojson" data={geojson}>
      <Layer
        id="fishability-layer"
        type="heatmap"
        paint={{
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(34,197,94,0)',
            0.2, 'rgb(34,197,94)',
            0.4, 'rgb(132,204,22)',
            0.6, 'rgb(234,179,8)',
            0.8, 'rgb(249,115,22)',
            1, 'rgb(239,68,68)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
          'heatmap-opacity': 0.6,
        }}
      />
    </Source>
  );
}
