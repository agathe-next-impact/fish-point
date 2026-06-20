'use client';

import { memo } from 'react';
import { Layer, Source, type LayerProps } from 'react-map-gl/maplibre';

export const ACCESS_SOURCE_ID = 'public-access-zones';
export const ACCESS_ZONE_LAYER_ID = 'public-access-zones-markers';

interface AccessZoneLayerProps {
  /** URL de tuiles MVT filtrées `kind=ACCESS_ZONE` (cf. MapContainer). */
  tileUrl: string;
}

// Marqueurs distincts (violets) des zones d'accès, pour ne pas les confondre avec les
// plans d'eau (cercles colorés par score). Affichés à fort zoom uniquement.
const accessLayer: LayerProps = {
  id: ACCESS_ZONE_LAYER_ID,
  type: 'circle',
  source: ACCESS_SOURCE_ID,
  'source-layer': 'spots',
  minzoom: 13,
  paint: {
    'circle-color': '#6d28d9',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 5, 16, 8],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
};

/**
 * Sous-couche « accès publics » (modèle 3 niveaux) : zones d'accès (`kind=ACCESS_ZONE`)
 * affichées UNIQUEMENT à fort zoom (z≥13). La source vectorielle ne charge ses tuiles
 * qu'à partir de z13 (`minzoom`) → aucun fetch en vue large. Tant qu'aucune ACCESS_ZONE
 * n'existe, la couche reste invisible (tuiles vides). Le clic est géré par MapContainer
 * (même popup que les plans d'eau : les tuiles portent les mêmes propriétés).
 */
export const AccessZoneLayer = memo(function AccessZoneLayer({ tileUrl }: AccessZoneLayerProps) {
  return (
    <Source
      key={tileUrl}
      id={ACCESS_SOURCE_ID}
      type="vector"
      tiles={[tileUrl]}
      minzoom={13}
      maxzoom={16}
    >
      <Layer {...accessLayer} />
    </Source>
  );
});
