'use client';

import { useCallback, useRef, useState } from 'react';
import Map, { NavigationControl, GeolocateControl, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import { useMapStore } from '@/store/map.store';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER } from '@/lib/mapbox';
import { SpotCluster } from './SpotCluster';
import { MapControls } from './MapControls';
import { MapFilters } from './MapFilters';
import { UserLocation } from './UserLocation';
import { HeatmapLayer } from './HeatmapLayer';
import { FishabilityLayer } from './FishabilityLayer';
import { RegulationZones } from './RegulationZones';
import type { SpotListItem } from '@/types/spot';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapContainerProps {
  spots?: SpotListItem[];
  onSpotClick?: (spot: SpotListItem) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

export function MapContainer({ spots = [], onSpotClick, onBoundsChange, className }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const viewport = useMapStore((s) => s.viewport);
  const setViewport = useMapStore((s) => s.setViewport);
  const activeLayers = useMapStore((s) => s.activeLayers);
  const [mapStyle, setMapStyle] = useState<string>(MAP_STYLES.outdoors);

  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewport({
        latitude: evt.viewState.latitude,
        longitude: evt.viewState.longitude,
        zoom: evt.viewState.zoom,
      });
    },
    [setViewport],
  );

  const handleStyleChange = useCallback((style: string) => {
    setMapStyle(style);
  }, []);

  const emitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;
    const b = map.getBounds();
    if (!b) return;
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, [onBoundsChange]);

  return (
    <div className={className || 'relative w-full h-full'}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: viewport.latitude || DEFAULT_CENTER.latitude,
          longitude: viewport.longitude || DEFAULT_CENTER.longitude,
          zoom: viewport.zoom || DEFAULT_CENTER.zoom,
        }}
        onMove={handleMove}
        onMoveEnd={emitBounds}
        onLoad={emitBounds}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[[-10, 40], [12, 52]]}
        minZoom={4}
        maxZoom={18}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
          positionOptions={{ enableHighAccuracy: true }}
        />

        {activeLayers.includes('spots') && (
          <SpotCluster spots={spots} onSpotClick={onSpotClick} />
        )}

        {activeLayers.includes('heatmap') && <HeatmapLayer spots={spots} />}

        {activeLayers.includes('fishability') && <FishabilityLayer spots={spots} />}

        {activeLayers.includes('regulations') && <RegulationZones />}

        <UserLocation />
      </Map>

      <MapControls
        mapStyle={mapStyle}
        onStyleChange={handleStyleChange}
      />
      <MapFilters />
    </div>
  );
}
