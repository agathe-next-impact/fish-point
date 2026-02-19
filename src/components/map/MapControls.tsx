'use client';

import { Map, Layers, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/store/map.store';
import { MAP_STYLES } from '@/lib/mapbox';
import { useState } from 'react';
import type { MapLayer } from '@/types/map';

interface MapControlsProps {
  mapStyle: string;
  onStyleChange: (style: string) => void;
}

export function MapControls({ mapStyle, onStyleChange }: MapControlsProps) {
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const activeLayers = useMapStore((s) => s.activeLayers);
  const [showLayers, setShowLayers] = useState(false);

  const layers: { id: MapLayer; label: string }[] = [
    { id: 'spots', label: 'Spots' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'regulations', label: 'Zones réglementées' },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        className="bg-background shadow-md"
        onClick={() => {
          const nextStyle = mapStyle === MAP_STYLES.outdoors ? MAP_STYLES.satellite : MAP_STYLES.outdoors;
          onStyleChange(nextStyle);
        }}
        aria-label="Changer le style de carte"
      >
        <Map className="h-4 w-4" />
      </Button>

      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          className="bg-background shadow-md"
          onClick={() => setShowLayers(!showLayers)}
          aria-label="Couches"
        >
          <Layers className="h-4 w-4" />
        </Button>

        {showLayers && (
          <div className="absolute left-12 top-0 bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
            <p className="text-xs font-semibold mb-2">Couches</p>
            {layers.map((layer) => (
              <label key={layer.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.includes(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{layer.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
