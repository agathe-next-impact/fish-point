'use client';

import { useCallback, useRef, useState } from 'react';
import Map, { NavigationControl, GeolocateControl, type MapRef, type ViewStateChangeEvent } from 'react-map-gl';
import { useMapStore } from '@/store/map.store';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER } from '@/lib/mapbox';
import { SpotCluster } from './SpotCluster';
import { MapControls } from './MapControls';
import { MapFilters } from './MapFilters';
import { UserLocation } from './UserLocation';
import { HeatmapLayer } from './HeatmapLayer';
import { RegulationZones } from './RegulationZones';
import type { SpotListItem } from '@/types/spot';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  spots?: SpotListItem[];
  onSpotClick?: (spot: SpotListItem) => void;
  className?: string;
}

export function MapContainer({ spots = [], onSpotClick, className }: MapContainerProps) {
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
