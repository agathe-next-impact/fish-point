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
   * Filtres « sortie » de l'Explorer — source d'état UNIQUE partagée avec la liste.
   * Sérialisés dans l'URL des tuiles MVT (marqueurs) ET appliqués au filtre JS des
   * couches heatmap/fishability, pour que carte et liste appliquent exactement les
   * mêmes filtres (convergence carte ↔ liste, sous-étape 4 : un seul état de filtres).
   * Optionnel par robustesse : absent ⇒ aucun filtre (la carte affiche tout).
   */
  spotFilters?: SpotQueryFilters;
}

const EMPTY_SPOT_FILTERS: SpotQueryFilters = {};

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
  // Source d'état UNIQUE : les filtres viennent du prop unifié `spotFilters`
  // (gridFilters de l'Explorer). Plus de slice `filters` dans le store map.
  const activeFilters = spotFilters ?? EMPTY_SPOT_FILTERS;
  const [styleKey, setStyleKey] = useState<MapStyleKey>(MAP_STYLE_KEYS.vector);
  const [selectedSpot, setSelectedSpot] = useState<SelectedTileSpot | null>(null);

  const mapStyle = useMemo(
    () => (styleKey === MAP_STYLE_KEYS.satellite ? buildSatelliteStyle() : getDefaultVectorStyle()),
    [styleKey],
  );

  // Filtre JS client pour les couches heatmap/fishability (les marqueurs MVT, eux,
  // sont filtrés côté serveur par les tuiles). Dérivé des filtres UNIFIÉS `activeFilters` :
  // mêmes filtres que la liste et que les tuiles, plus aucune divergence d'état.
  // NOTE (sous-étape 5) : cette copie JS pourra disparaître au profit des tuiles seules.
  const filteredSpots = useMemo(() => {
    const waterTypes = activeFilters.waterType ?? [];
    // Mode et technique ciblent la même colonne `fishingTypes` ; intersection des deux
    // intentions, à l'identique de `buildSpotWhere` (hasSome modes ET hasSome techniques).
    const modes = activeFilters.fishingMode ?? [];
    const techniques = activeFilters.fishingTechnique ?? [];
    const minRating = activeFilters.minRating ?? 0;
    const minScore = activeFilters.minFishabilityScore ?? 0;

    return spots.filter((spot) => {
      if (waterTypes.length > 0 && !waterTypes.includes(spot.waterType)) return false;
      if (modes.length > 0 && !spot.fishingTypes.some((t) => modes.includes(t))) return false;
      if (techniques.length > 0 && !spot.fishingTypes.some((t) => techniques.includes(t))) {
        return false;
      }
      if (minRating > 0 && spot.averageRating < minRating) return false;
      if (
        minScore > 0 &&
        (spot.fishabilityScore == null || spot.fishabilityScore < minScore)
      ) {
        return false;
      }
      if (activeFilters.showAutoDiscovered === false && spot.dataOrigin !== 'USER') return false;
      if (activeFilters.pmr && !spot.accessibility?.pmr) return false;
      if (activeFilters.nightFishing && !spot.accessibility?.nightFishing) return false;
      if (activeFilters.premiumOnly && !spot.isPremium) return false;
      return true;
    });
  }, [activeFilters, spots]);

  const spotTileUrl = useMemo(() => {
    // Source d'état UNIFIÉE : les marqueurs MVT honorent EXACTEMENT les filtres de la liste
    // (espèce/mode/technique/accès + premium/auto-découverts), sérialisés via le helper
    // PARTAGÉ `serializeSpotFilters` — fin de la divergence carte ↔ liste. Plus de branche
    // « carte autonome » : `/map` redirige vers l'Explorer (sous-étape 4).
    const params = serializeSpotFilters(activeFilters);
    const suffix = params.size > 0 ? `?${params}` : '';
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return `${origin}/api/spots/tiles/{z}/{x}/{y}.mvt${suffix}`;
  }, [activeFilters]);

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
    </div>
  );
}
