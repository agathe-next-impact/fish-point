'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
  type MarkerEvent,
} from 'react-map-gl/maplibre';
import Link from 'next/link';
import { MapPin, Navigation } from 'lucide-react';
import {
  MAP_MAX_BOUNDS,
  getDefaultVectorStyle,
  savedSpotsCamera,
} from '@/lib/map';
import '@/lib/map-runtime'; // side-effect: registers `pmtiles://` protocol on client
import { buildDirectionsUrl } from '@/lib/directions';
import { formatSpotName } from '@/lib/spot-name';
import type { SavedSpotView } from '@/hooks/useSavedSpots';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Carte des SEULS spots enregistrés (slice 1b).
 *
 * Contrairement à `MapContainer` (marqueurs servis par des tuiles MVT GLOBALES,
 * impossibles à restreindre à une sélection d'IDs), ce composant rend un
 * `<Marker>` EXPLICITE par `SavedSpotView`. La carte ne peut donc afficher QUE
 * les spots passés en prop — déjà filtrés par la collection active côté page.
 *
 * Cadrage initial : `initialViewState` dérivé de `savedSpotsCamera` (pur, testé) —
 * `fitBounds` sur l'enveloppe quand ≥2 points distincts, centre + zoom rapproché
 * pour 1 spot (ou points confondus), repli `DEFAULT_CENTER` quand 0 spot. Le
 * recadrage au changement de collection se fait impérativement (`map.fitBounds`)
 * sans aucun `setState` dans un effet.
 *
 * Note : le fond vectoriel PMTiles peut rester vide tant que la config runtime
 * `NEXT_PUBLIC_PMTILES_FILE` n'est pas posée — les marqueurs s'affichent quand même.
 */

interface SavedSpotsMapProps {
  spots: SavedSpotView[];
  className?: string;
}

/** Padding du `fitBounds` (px) pour que les marqueurs de bord ne soient pas collés au cadre. */
const FIT_PADDING = 56;
/** Évite de zoomer à fond quand tous les spots sont quasi au même endroit. */
const FIT_MAX_ZOOM = 13;

export function SavedSpotsMap({ spots, className }: SavedSpotsMapProps) {
  const mapRef = useRef<MapRef>(null);
  // Spot dont la popup est ouverte (id). `null` = aucune popup.
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);

  const mapStyle = useMemo(() => getDefaultVectorStyle(), []);

  // Caméra initiale dérivée des points (pure). Recalculée si la sélection change ;
  // sert au 1er rendu ET de source au recadrage impératif ci-dessous.
  const camera = useMemo(() => savedSpotsCamera(spots), [spots]);

  const initialViewState = useMemo(() => {
    if (camera.kind === 'bounds') {
      return {
        bounds: camera.bounds,
        fitBoundsOptions: { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM },
      };
    }
    return {
      latitude: camera.latitude,
      longitude: camera.longitude,
      zoom: camera.zoom,
    };
  }, [camera]);

  // Recadrage quand la collection change la sélection de spots. Impératif via le
  // ref MapLibre (pas de `setState` dans un effet → respecte la règle de hooks).
  // `useCallback` mémoïse sur `camera` ; appelé une fois la carte chargée et à
  // chaque changement de `camera` via la clé de re-render (voir plus bas).
  const frameToCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (camera.kind === 'bounds') {
      map.fitBounds(camera.bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 350 });
    } else {
      map.easeTo({ center: [camera.longitude, camera.latitude], zoom: camera.zoom, duration: 350 });
    }
  }, [camera]);

  // Recadre quand la collection active modifie la sélection (donc `camera`). Le 1er
  // cadrage est fait par `onLoad` ; ce ref évite un double-recadrage au montage.
  // Appel IMPÉRATIF uniquement (`map.fitBounds`/`easeTo`) — AUCUN setState ici.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    frameToCamera();
  }, [frameToCamera]);

  const handleMarkerClick = useCallback(
    (spotId: string) => (event: MarkerEvent<MouseEvent>) => {
      // Empêche le clic carte de refermer aussitôt la popup qu'on ouvre.
      event.originalEvent.stopPropagation();
      setOpenSpotId(spotId);
    },
    [],
  );

  const openSpot = useMemo(
    () => spots.find((s) => s.spotId === openSpotId) ?? null,
    [spots, openSpotId],
  );

  return (
    <div className={className ?? 'relative h-full w-full'}>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        onLoad={frameToCamera}
        onClick={() => setOpenSpotId(null)}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        maxBounds={MAP_MAX_BOUNDS}
        minZoom={4}
        maxZoom={18}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {spots.map((spot) => {
          const displayName = formatSpotName({
            name: spot.name,
            commune: null,
            waterType: spot.waterType,
          });
          return (
            <Marker
              key={spot.spotId}
              latitude={spot.latitude}
              longitude={spot.longitude}
              anchor="bottom"
              onClick={handleMarkerClick(spot.spotId)}
            >
              <button
                type="button"
                aria-label={`Spot enregistré : ${displayName}`}
                className="group flex cursor-pointer flex-col items-center focus-visible:outline-none"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-fs-accent shadow-fs-sm transition-transform group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
                  <MapPin className="h-3.5 w-3.5 text-white" strokeWidth={2.2} aria-hidden />
                </span>
              </button>
            </Marker>
          );
        })}

        {openSpot && (
          <Popup
            latitude={openSpot.latitude}
            longitude={openSpot.longitude}
            anchor="bottom"
            offset={28}
            closeOnClick={false}
            onClose={() => setOpenSpotId(null)}
            className="saved-spot-popup"
          >
            <div className="min-w-[180px] p-1">
              <h2 className="fs-dsp mb-2 text-sm font-bold text-ink">
                {formatSpotName({ name: openSpot.name, commune: null, waterType: openSpot.waterType })}
              </h2>
              <div className="flex flex-col gap-1.5">
                <Link
                  href={`/spots/${openSpot.slug}`}
                  className="inline-flex items-center justify-center rounded-md bg-fs-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Voir la fiche
                </Link>
                <a
                  href={buildDirectionsUrl(openSpot.latitude, openSpot.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Navigation className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
                  Itinéraire
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
