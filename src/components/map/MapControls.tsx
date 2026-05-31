'use client';

import { Layers, Map } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/store/map.store';
import { MAP_STYLE_KEYS, type MapStyleKey } from '@/lib/map';
import type { MapLayer } from '@/types/map';

interface MapControlsProps {
  styleKey: MapStyleKey;
  onStyleChange: (next: MapStyleKey) => void;
  visibleSpotCount?: number;
  isLoading?: boolean;
}

export function MapControls({
  styleKey,
  onStyleChange,
  visibleSpotCount = 0,
  isLoading = false,
}: MapControlsProps) {
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const activeLayers = useMapStore((s) => s.activeLayers);
  const [showLayers, setShowLayers] = useState(false);

  const layers: { id: MapLayer; label: string; hint: string }[] = [
    { id: 'spots', label: 'Spots', hint: 'Marqueurs visibles' },
    { id: 'privateSpots', label: 'Prives', hint: 'Vos lieux enregistres' },
    { id: 'heatmap', label: 'Densite', hint: 'Concentration des spots' },
    { id: 'fishability', label: 'Fishabilite', hint: 'Intensite du score' },
    { id: 'regulations', label: 'Reglementation', hint: 'Zones et restrictions' },
  ];

  return (
    <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col gap-2 sm:left-4 sm:top-4">
      <div className="flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-md backdrop-blur">
        <Button
          variant={styleKey === MAP_STYLE_KEYS.vector ? 'default' : 'ghost'}
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          onClick={() => onStyleChange(MAP_STYLE_KEYS.vector)}
          aria-label="Vue carte"
          aria-pressed={styleKey === MAP_STYLE_KEYS.vector}
        >
          <Map className="h-4 w-4" />
          Carte
        </Button>
        <Button
          variant={styleKey === MAP_STYLE_KEYS.satellite ? 'default' : 'ghost'}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onStyleChange(MAP_STYLE_KEYS.satellite)}
          aria-label="Vue satellite"
          aria-pressed={styleKey === MAP_STYLE_KEYS.satellite}
        >
          Sat.
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <span className="min-w-12 px-1 text-right text-xs text-muted-foreground" aria-live="polite">
          {isLoading ? '...' : visibleSpotCount > 0 ? visibleSpotCount : 'MVT'}
        </span>
      </div>

      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-background/95 shadow-md backdrop-blur"
          onClick={() => setShowLayers((open) => !open)}
          aria-label="Couches"
          aria-expanded={showLayers}
        >
          <Layers className="h-4 w-4" />
        </Button>

        {showLayers && (
          <div className="absolute left-12 top-0 min-w-[220px] rounded-md border bg-background/95 p-3 shadow-lg backdrop-blur">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Couches</p>
            {layers.map((layer) => (
              <label key={layer.id} className="flex cursor-pointer items-start gap-2 rounded px-1 py-1.5 hover:bg-muted">
                <input
                  type="checkbox"
                  checked={activeLayers.includes(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                  className="mt-0.5 rounded border-gray-300"
                />
                <span>
                  <span className="block text-sm leading-4">{layer.label}</span>
                  <span className="block text-xs text-muted-foreground">{layer.hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
