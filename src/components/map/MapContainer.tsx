'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Map, { NavigationControl, GeolocateControl, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import { useMapStore } from '@/store/map.store';
import { DEFAULT_CENTER, MAP_STYLE_KEYS, buildSatelliteStyle, getDefaultVectorStyle, type MapStyleKey } from '@/lib/map';
import '@/lib/map-runtime'; // side-effect: registers `pmtiles://` protocol on client
import { SpotCluster } from './SpotCluster';
import { MapControls } from './MapControls';
import { MapFilters } from './MapFilters';
import { UserLocation } from './UserLocation';
import { HeatmapLayer } from './HeatmapLayer';
import { FishabilityLayer } from './FishabilityLayer';
import { RegulationZones } from './RegulationZones';
import { PrivateSpotMarker } from '@/components/private-spots/PrivateSpotMarker';
import type { SpotListItem } from '@/types/spot';
import type { PrivateSpotSummary } from '@/types/private-spot';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapContainerProps {
  spots?: SpotListItem[];
  privateSpots?: PrivateSpotSummary[];
  onSpotClick?: (spot: SpotListItem) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

export function MapContainer({ spots = [], privateSpots = [], onSpotClick, onBoundsChange, className }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const viewport = useMapStore((s) => s.viewport);
  const setViewport = useMapStore((s) => s.setViewport);
  const activeLayers = useMapStore((s) => s.activeLayers);
  const [styleKey, setStyleKey] = useState<MapStyleKey>(MAP_STYLE_KEYS.vector);

  const mapStyle = useMemo(
    () => (styleKey === MAP_STYLE_KEYS.satellite ? buildSatelliteStyle() : getDefaultVectorStyle()),
    [styleKey],
  );

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

  const handleStyleChange = useCallback((next: MapStyleKey) => {
    setStyleKey(next);
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
          positionOptions={{ enableHighAccuracy: true }}
        />

        {activeLayers.includes('spots') && (
          <SpotCluster spots={spots} onSpotClick={onSpotClick} />
        )}

        {activeLayers.includes('heatmap') && <HeatmapLayer spots={spots} />}

        {activeLayers.includes('fishability') && <FishabilityLayer spots={spots} />}

        {activeLayers.includes('regulations') && <RegulationZones />}

        {activeLayers.includes('privateSpots') && privateSpots.map((ps) => (
          <PrivateSpotMarker key={ps.id} spot={ps} />
        ))}

        <UserLocation />
      </Map>

      <MapControls
        styleKey={styleKey}
        onStyleChange={handleStyleChange}
      />
      <MapFilters />
    </div>
  );
}
