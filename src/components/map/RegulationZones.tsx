'use client';

import { Source, Layer } from 'react-map-gl';

const REGULATION_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [],
};

export function RegulationZones() {
  return (
    <Source type="geojson" data={REGULATION_GEOJSON}>
      <Layer
        id="regulation-zones-fill"
        type="fill"
        paint={{
          'fill-color': [
            'match',
            ['get', 'status'],
            'allowed', '#22c55e',
            'restricted', '#f97316',
            'forbidden', '#ef4444',
            '#94a3b8',
          ],
          'fill-opacity': 0.15,
        }}
      />
      <Layer
        id="regulation-zones-line"
        type="line"
        paint={{
          'line-color': [
            'match',
            ['get', 'status'],
            'allowed', '#16a34a',
            'restricted', '#ea580c',
            'forbidden', '#dc2626',
            '#64748b',
          ],
          'line-width': 2,
        }}
      />
    </Source>
  );
}
