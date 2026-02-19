'use client';

import { Source, Layer } from 'react-map-gl';
import { useMemo } from 'react';
import type { SpotListItem } from '@/types/spot';
import type { GeoJSONFeatureCollection } from '@/types/map';

interface HeatmapLayerProps {
  spots: SpotListItem[];
}

export function HeatmapLayer({ spots }: HeatmapLayerProps) {
  const geojson: GeoJSONFeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: spots.map((spot) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [spot.longitude, spot.latitude],
        },
        properties: {
          weight: spot.averageRating / 5,
        },
      })),
    }),
    [spots],
  );

  return (
    <Source type="geojson" data={geojson}>
      <Layer
        id="heatmap-layer"
        type="heatmap"
        paint={{
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,255,0)',
            0.2, 'rgb(0,0,255)',
            0.4, 'rgb(0,255,0)',
            0.6, 'rgb(255,255,0)',
            0.8, 'rgb(255,128,0)',
            1, 'rgb(255,0,0)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
          'heatmap-opacity': 0.6,
        }}
      />
    </Source>
  );
}
