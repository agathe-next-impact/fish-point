'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Layer, Popup, Source, type LayerProps } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import { Navigation, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-badge';
import { SaveSpotButton } from '@/components/spots/SaveSpotButton';
import { WATER_TYPE_LABELS } from '@/lib/constants';
import { formatDistance } from '@/lib/map';
import { buildDirectionsUrl } from '@/lib/directions';
import { formatSpotName } from '@/lib/spot-name';
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
    // FishSpot two-tier score rule: >=80 green, <80 amber; teal/faint fallback
    'circle-color': [
      'case',
      ['has', 'fishabilityScore'],
      ['step', ['to-number', ['get', 'fishabilityScore']], '#d98a1c', 80, '#1f9d6b'],
      ['case', ['get', 'isVerified'], '#0e8c7f', '#8aa0a4'],
    ],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 10, 8, 15, 11],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2.5,
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
  // `commune` n'existe que sur le preview enrichi (SpotListItem) ; la sélection
  // depuis la tuile (SelectedTileSpot) ne la porte pas → on la lit depuis le preview.
  const popupCommune = preview?.commune ?? null;
  const popupName = popupSpot
    ? formatSpotName({ name: popupSpot.name, commune: popupCommune, waterType: popupSpot.waterType })
    : '';

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
          <div className="min-w-[210px] p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="fs-dsp text-[15px] font-bold leading-tight text-ink">{popupName}</h3>
              {popupSpot.fishabilityScore != null && (
                <ScoreBadge score={popupSpot.fishabilityScore} size="sm" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-aqua-soft px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
                {WATER_TYPE_LABELS[popupSpot.waterType] || popupSpot.waterType}
              </span>
              {popupSpot.averageRating > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-semibold text-ink">
                  <Star className="h-3 w-3 fill-amber text-amber" />
                  {popupSpot.averageRating.toFixed(1)}
                </span>
              )}
            </div>
            {preview?.distance !== undefined && (
              <p className="mt-2 flex items-center gap-1 text-xs text-fs-muted">
                <Navigation className="h-3 w-3" />
                {formatDistance(preview.distance)}
              </p>
            )}
            {/* Enregistrer + Itinéraire directement depuis le marqueur, sans ouvrir la fiche */}
            <div className="mt-3 flex items-center gap-1.5">
              <SaveSpotButton
                variant="compact"
                spot={{
                  id: popupSpot.id,
                  slug: popupSpot.slug,
                  name: popupSpot.name,
                  latitude: popupSpot.latitude,
                  longitude: popupSpot.longitude,
                }}
              />
              <a
                href={buildDirectionsUrl(popupSpot.latitude, popupSpot.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Itinéraire vers ${popupName}`}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md border border-input bg-background px-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden /> Itinéraire
              </a>
            </div>
            <Link href={`/spots/${popupSpot.slug}`}>
              <Button size="sm" className="mt-2 w-full text-xs">
                Voir la fiche
              </Button>
            </Link>
          </div>
        </Popup>
      )}
    </>
  );
});
