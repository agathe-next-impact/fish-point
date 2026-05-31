'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Layer, Popup, Source, type LayerProps } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import { Navigation, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WATER_TYPE_LABELS } from '@/lib/constants';
import { formatDistance } from '@/lib/map';
import type { SpotListItem } from '@/types/spot';

export const SPOTS_SOURCE_ID = 'public-spots';
export const UNCLUSTERED_LAYER_ID = 'public-spots-unclustered';
export const UNCLUSTERED_SCORE_LAYER_ID = 'public-spots-score';

export interface SelectedTileSpot {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  waterType: SpotListItem['waterType'];
  averageRating: number;
  fishabilityScore: number | null;
}

interface SpotLayerProps {
  tileUrl: string;
  selectedSpot: SelectedTileSpot | null;
  onClosePopup: () => void;
}

const unclusteredLayer: LayerProps = {
  id: UNCLUSTERED_LAYER_ID,
  type: 'circle',
  source: SPOTS_SOURCE_ID,
  'source-layer': 'spots',
  paint: {
    'circle-color': [
      'case',
      ['has', 'fishabilityScore'],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['get', 'fishabilityScore']],
        0,
        '#ef4444',
        20,
        '#f97316',
        40,
        '#eab308',
        60,
        '#84cc16',
        80,
        '#22c55e',
      ],
      ['case', ['get', 'isVerified'], '#0ea5e9', '#64748b'],
    ],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4, 10, 7, 15, 10],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 1.5,
  },
};

const scoreLayer: LayerProps = {
  id: UNCLUSTERED_SCORE_LAYER_ID,
  type: 'symbol',
  source: SPOTS_SOURCE_ID,
  'source-layer': 'spots',
  minzoom: 10,
  filter: ['has', 'fishabilityScore'],
  layout: {
    'text-field': ['to-string', ['get', 'fishabilityScore']],
    'text-font': ['Noto Sans Bold'],
    'text-size': 10,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': '#ffffff',
  },
};

function getFishabilityColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

async function fetchSpotPreview(id: string): Promise<SpotListItem> {
  const response = await fetch(`/api/spots/map-preview/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error('Failed to fetch spot preview');
  const json = await response.json();
  return json.data;
}

export const SpotLayer = memo(function SpotLayer({ tileUrl, selectedSpot, onClosePopup }: SpotLayerProps) {
  const { data: preview } = useQuery({
    queryKey: ['spotMapPreview', selectedSpot?.id],
    queryFn: () => fetchSpotPreview(selectedSpot!.id),
    enabled: !!selectedSpot?.id,
    staleTime: 5 * 60 * 1000,
  });

  const popupSpot = preview ?? selectedSpot;

  return (
    <>
      <Source
        key={tileUrl}
        id={SPOTS_SOURCE_ID}
        type="vector"
        tiles={[tileUrl]}
        minzoom={0}
        maxzoom={16}
      >
        <Layer {...unclusteredLayer} />
        <Layer {...scoreLayer} />
      </Source>

      {popupSpot && (
        <Popup
          latitude={popupSpot.latitude}
          longitude={popupSpot.longitude}
          anchor="bottom"
          offset={18}
          closeOnClick={false}
          onClose={onClosePopup}
          className="spot-popup"
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-sm mb-1">{popupSpot.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {WATER_TYPE_LABELS[popupSpot.waterType] || popupSpot.waterType}
              </Badge>
              {popupSpot.averageRating > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  {popupSpot.averageRating.toFixed(1)}
                </span>
              )}
              {popupSpot.fishabilityScore != null && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getFishabilityColor(popupSpot.fishabilityScore) }}
                >
                  {popupSpot.fishabilityScore}
                </span>
              )}
            </div>
            {preview?.distance !== undefined && (
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {formatDistance(preview.distance)}
              </p>
            )}
            <Link href={`/spots/${popupSpot.slug}`}>
              <Button size="sm" className="w-full text-xs">
                Voir detail
              </Button>
            </Link>
          </div>
        </Popup>
      )}
    </>
  );
});
