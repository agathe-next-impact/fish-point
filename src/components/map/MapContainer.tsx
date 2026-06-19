'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Map, {
  NavigationControl,
  GeolocateControl,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import { useMapStore } from '@/store/map.store';
import {
  DEFAULT_CENTER,
  MAP_MAX_BOUNDS,
  MAP_STYLE_KEYS,
  buildSatelliteStyle,
  getDefaultVectorStyle,
  type MapStyleKey,
} from '@/lib/map';
import '@/lib/map-runtime'; // side-effect: registers `pmtiles://` protocol on client
import {
  UNCLUSTERED_LAYER_ID,
  UNCLUSTERED_SCORE_LAYER_ID,
  SpotLayer,
  type SelectedTileSpot,
} from './SpotLayer';
import { MapControls } from './MapControls';
import { MapFilters } from './MapFilters';
import { UserLocation } from './UserLocation';
import { HeatmapLayer } from './HeatmapLayer';
import { FishabilityLayer } from './FishabilityLayer';
import { RegulationZones } from './RegulationZones';
import { PrivateSpotMarker } from '@/components/private-spots/PrivateSpotMarker';
import { serializeSpotFilters, type SpotQueryFilters } from '@/lib/spot-filter-params';
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
  onBoundsChange?: (bounds: MapBounds) => void;
  isLoading?: boolean;
  className?: string;
  /**
   * Filtres « sortie » de l'Explorer (source d'état partagée avec la liste). Quand fournis,
   * ils sont sérialisés dans l'URL des tuiles MVT pour que les MARQUEURS de la carte
   * appliquent exactement les mêmes filtres que la liste (convergence carte ↔ liste).
   * Absents (carte autonome `/map`) : on retombe sur les filtres du store `MapFiltersState`.
   */
  spotFilters?: SpotQueryFilters;
}

export function MapContainer({
  spots = [],
  privateSpots = [],
  onBoundsChange,
  isLoading = false,
  className,
  spotFilters,
}: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const viewport = useMapStore((s) => s.viewport);
  const setViewport = useMapStore((s) => s.setViewport);
  const activeLayers = useMapStore((s) => s.activeLayers);
  const filters = useMapStore((s) => s.filters);
  const [styleKey, setStyleKey] = useState<MapStyleKey>(MAP_STYLE_KEYS.vector);
  const [selectedSpot, setSelectedSpot] = useState<SelectedTileSpot | null>(null);

  const mapStyle = useMemo(
    () => (styleKey === MAP_STYLE_KEYS.satellite ? buildSatelliteStyle() : getDefaultVectorStyle()),
    [styleKey],
  );

  const filteredSpots = useMemo(
    () =>
      spots.filter((spot) => {
        if (filters.waterTypes.length > 0 && !filters.waterTypes.includes(spot.waterType)) return false;
        if (
          filters.fishingTypes.length > 0 &&
          !spot.fishingTypes.some((type) => filters.fishingTypes.includes(type))
        ) {
          return false;
        }
        if (filters.minRating > 0 && spot.averageRating < filters.minRating) return false;
        if (
          filters.minFishabilityScore > 0 &&
          (spot.fishabilityScore == null || spot.fishabilityScore < filters.minFishabilityScore)
        ) {
          return false;
        }
        if (!filters.showAutoDiscovered && spot.dataOrigin !== 'USER') return false;
        if (filters.pmr && !spot.accessibility?.pmr) return false;
        if (filters.nightFishing && !spot.accessibility?.nightFishing) return false;
        if (filters.premiumOnly && !spot.isPremium) return false;
        return true;
      }),
    [filters, spots],
  );

  const spotTileUrl = useMemo(() => {
    // Source d'état UNIFIÉE : quand l'Explorer fournit `spotFilters` (les mêmes filtres
    // que la liste envoie à /api/spots), on les sérialise via le helper PARTAGÉ pour que
    // les marqueurs MVT honorent espèce/mode/technique/accès — fin de la divergence.
    // Sinon (carte autonome /map), on retombe sur les filtres du store `MapFiltersState`.
    let params: URLSearchParams;
    if (spotFilters) {
      params = serializeSpotFilters(spotFilters);
    } else {
      // Carte autonome `/map` : on conserve EXACTEMENT la sémantique historique du store
      // (`fishingTypes` plat envoyé via l'alias legacy `fishingType` = match ANY type, pas
      // l'intersection mode∧technique de la liste). Aucune régression de comportement /map.
      params = serializeSpotFilters({
        waterType: filters.waterTypes,
        minRating: filters.minRating,
        minFishabilityScore: filters.minFishabilityScore,
        pmr: filters.pmr,
        nightFishing: filters.nightFishing,
      });
      filters.fishingTypes.forEach((type) => params.append('fishingType', type));
    }

    // Params propres au panneau overlay carte (MapFilters), absents du modèle liste :
    // ils restent pilotés par le store et s'ajoutent quelle que soit la source ci-dessus.
    if (!filters.showAutoDiscovered) params.set('origin', 'USER');
    if (filters.premiumOnly) params.set('premiumOnly', 'true');

    const suffix = params.size > 0 ? `?${params}` : '';
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return `${origin}/api/spots/tiles/{z}/{x}/{y}.mvt${suffix}`;
  }, [filters, spotFilters]);

  const handleStyleChange = useCallback((next: MapStyleKey) => {
    setStyleKey(next);
  }, []);

  const syncMapState = useCallback((evt?: ViewStateChangeEvent) => {
    const map = mapRef.current;
    if (!map) return;
    if (evt) {
      setViewport({
        latitude: evt.viewState.latitude,
        longitude: evt.viewState.longitude,
        zoom: evt.viewState.zoom,
        bearing: evt.viewState.bearing,
        pitch: evt.viewState.pitch,
      });
    }
    const b = map.getBounds();
    if (!b) return;
    const nextBounds = {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    };
    onBoundsChange?.(nextBounds);
  }, [onBoundsChange, setViewport]);

  const interactiveLayerIds = activeLayers.includes('spots')
    ? [UNCLUSTERED_LAYER_ID, UNCLUSTERED_SCORE_LAYER_ID]
    : [];

  const handleMapClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedSpot(null);
      return;
    }

    const [longitude, latitude] = event.lngLat.toArray();
    if (feature.layer.id === UNCLUSTERED_LAYER_ID || feature.layer.id === UNCLUSTERED_SCORE_LAYER_ID) {
      const properties = feature.properties;
      if (typeof properties?.id === 'string') {
        setSelectedSpot({
          id: properties.id,
          slug: typeof properties.slug === 'string' ? properties.slug : properties.id,
          name: typeof properties.name === 'string' ? properties.name : 'Spot',
          latitude,
          longitude,
          waterType: properties.waterType as SelectedTileSpot['waterType'],
          averageRating: Number(properties.averageRating ?? 0),
          fishabilityScore: properties.fishabilityScore == null ? null : Number(properties.fishabilityScore),
        });
      }
    }
  }, []);

  return (
    <div className={className || 'relative w-full h-full'}>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: viewport.latitude || DEFAULT_CENTER.latitude,
          longitude: viewport.longitude || DEFAULT_CENTER.longitude,
          zoom: viewport.zoom || DEFAULT_CENTER.zoom,
        }}
        onMoveEnd={syncMapState}
        onLoad={() => syncMapState()}
        onClick={handleMapClick}
        interactiveLayerIds={interactiveLayerIds}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        maxBounds={MAP_MAX_BOUNDS}
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
          <SpotLayer
            tileUrl={spotTileUrl}
            selectedSpot={selectedSpot}
            onClosePopup={() => setSelectedSpot(null)}
          />
        )}

        {activeLayers.includes('heatmap') && <HeatmapLayer spots={filteredSpots} />}

        {activeLayers.includes('fishability') && <FishabilityLayer spots={filteredSpots} />}

        {activeLayers.includes('regulations') && <RegulationZones />}

        {activeLayers.includes('privateSpots') && privateSpots.map((ps) => (
          <PrivateSpotMarker key={ps.id} spot={ps} />
        ))}

        <UserLocation />
      </Map>

      <MapControls
        styleKey={styleKey}
        onStyleChange={handleStyleChange}
        visibleSpotCount={filteredSpots.length}
        isLoading={isLoading}
      />
      <MapFilters />
    </div>
  );
}
