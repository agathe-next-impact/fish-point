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
   * Filtres « sortie »/« affichage » de l'Explorer — source d'état UNIQUE partagée avec
   * la liste. Sérialisés dans l'URL des tuiles MVT (marqueurs). Les couches
   * heatmap/fishability, elles, consomment `spots` (bbox) déjà filtré CÔTÉ SERVEUR avec
   * le même jeu de filtres (sous-étape 5 : suppression de la copie JS de filtrage). La
   * carte et la liste appliquent donc exactement les mêmes filtres.
   * Optionnel par robustesse : absent ⇒ aucun filtre (la carte affiche tout).
   */
  spotFilters?: SpotQueryFilters;
  /**
   * Suffixe de query « contexte sortie » (`species=…&mode=…&lat=…&lng=…`) propagé au
   * lien « Voir la fiche » du popup marqueur, pour y déclencher le verdict « Adapté à
   * votre sortie ». Chaîne vide ⇒ lien inchangé. Même source que la liste
   * (`buildTripContextQuery`, dérivé des filtres actifs côté Explorer).
   */
  tripQuery?: string;
}

const EMPTY_SPOT_FILTERS: SpotQueryFilters = {};

export function MapContainer({
  spots = [],
  privateSpots = [],
  onBoundsChange,
  isLoading = false,
  className,
  spotFilters,
  tripQuery = '',
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
            tripQuery={tripQuery}
          />
        )}

        {/* `spots` (bbox) est déjà filtré côté serveur avec le même jeu que les tuiles
            et la liste — plus de copie JS de filtrage (sous-étape 5). */}
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
        visibleSpotCount={spots.length}
        isLoading={isLoading}
      />
    </div>
  );
}
