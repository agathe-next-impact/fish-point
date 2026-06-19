'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Bookmark, List, Map as MapIcon, MapPin, Navigation, Route, LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSavedSpots, type SavedSpotView } from '@/hooks/useSavedSpots';
import { SavedSpotsMap } from '@/components/spots/SavedSpotsMap';
import { buildDirectionsUrl } from '@/lib/directions';
import { formatDistance } from '@/lib/map';
import { WATER_TYPE_LABELS } from '@/lib/constants';
import { getDepartmentName } from '@/config/departments';
import { formatSpotName } from '@/lib/spot-name';
import { deriveCollections } from '@/lib/collections';

/** Vue de l'espace Enregistrés : état LOCAL, indépendant du store Explorer. */
type SavedView = 'list' | 'map';

/**
 * Espace « Enregistrés » (slice P1.1) — la liste des spots qu'un pêcheur a mis de
 * côté pour préparer une sortie. Deux sources transparentes : serveur (connecté)
 * ou local (invité), fusionnées par `useSavedSpots`. Tri par distance dès que la
 * géoloc est accordée. Sélecteur Liste / Carte (slice 1b) : la vue Carte rend
 * `SavedSpotsMap`, un composant à marqueurs EXPLICITES (un par spot enregistré),
 * car `MapContainer` sert ses marqueurs via tuiles MVT globales et ne peut pas se
 * restreindre à une sélection. Les onglets de collection filtrent les DEUX vues.
 */
export default function SavedSpotsPage() {
  const { latitude, longitude, loading: geoLoading, error: geoError, requestPosition } = useGeolocation();

  const origin = useMemo(
    () => (latitude != null && longitude != null ? { latitude, longitude } : null),
    [latitude, longitude],
  );

  const { spots, isLoading, isError, isGuest } = useSavedSpots(origin);

  // Collection active (valeur `listName`). `null` = « Tous ». L'utilisateur choisit ;
  // on ne synchronise pas via effet — si la collection disparaît, `effectiveCollection`
  // retombe sur « Tous » par dérivation (évite tout setState dans un effet).
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  // Vue Liste / Carte. État LOCAL `useState`, indépendant du store Explorer.
  const [view, setView] = useState<SavedView>('list');

  // Collections distinctes dérivées des `listName` présents (« Favoris » d'abord).
  const collections = useMemo(() => deriveCollections(spots), [spots]);

  const effectiveCollection =
    activeCollection !== null && collections.some((c) => c.listName === activeCollection)
      ? activeCollection
      : null;

  // Spots du filtre actif. « Tous » quand aucune collection active.
  const visibleSpots = useMemo(
    () =>
      effectiveCollection === null
        ? spots
        : spots.filter((s) => s.listName === effectiveCollection),
    [spots, effectiveCollection],
  );

  /**
   * « Préparer la sortie » : itinéraire multi-arrêts Google Maps depuis la
   * position courante vers le 1er spot, en passant par les suivants (jusqu'à 9
   * waypoints, limite Google Maps). Suit le filtre de collection actif.
   */
  const tripUrl = useMemo(() => buildTripUrl(visibleSpots), [visibleSpots]);

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-fs-accent" strokeWidth={2} aria-hidden />
          <h1 className="fs-dsp text-2xl font-extrabold text-ink">Enregistrés</h1>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />

          <Button
            variant="outline"
            size="sm"
            onClick={requestPosition}
            disabled={geoLoading}
            aria-label="Trier par distance autour de moi"
          >
            {geoLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden />
            )}
            {origin ? 'Autour de moi' : 'Trier par distance'}
          </Button>

          {tripUrl && (
            <a
              href={tripUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-fs-accent px-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Route className="h-4 w-4" strokeWidth={2} aria-hidden /> Préparer la sortie
            </a>
          )}
        </div>
      </header>

      {geoError && (
        <p className="mb-4 text-sm text-fs-muted" role="status">
          {geoError} — la liste reste triée par date d’enregistrement.
        </p>
      )}

      {!isLoading && !isError && spots.length > 0 && collections.length > 1 && (
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par collection"
        >
          <CollectionTab
            label="Tous"
            count={spots.length}
            active={effectiveCollection === null}
            onClick={() => setActiveCollection(null)}
          />
          {collections.map((collection) => (
            <CollectionTab
              key={collection.listName}
              label={collection.label}
              count={collection.count}
              active={effectiveCollection === collection.listName}
              onClick={() => setActiveCollection(collection.listName)}
            />
          ))}
        </div>
      )}

      {isLoading ? (
        <ul className="grid gap-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-20" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="py-16 text-center text-fs-muted" role="alert">
          Impossible de charger vos spots enregistrés pour le moment. Réessayez dans un instant.
        </p>
      ) : spots.length === 0 ? (
        <EmptyState isGuest={isGuest} />
      ) : (
        <>
          {isGuest && (
            <p className="mb-4 rounded-fs-md border border-line bg-card px-3 py-2 text-sm text-fs-muted">
              Vos spots sont enregistrés sur cet appareil.{' '}
              <Link href="/login" className="font-semibold text-fs-accent underline">
                Connectez-vous
              </Link>{' '}
              pour les retrouver partout.
            </p>
          )}
          {visibleSpots.length === 0 ? (
            <p className="py-12 text-center text-fs-muted">
              Aucun spot dans cette collection pour le moment.
            </p>
          ) : view === 'map' ? (
            <div className="h-[60vh] min-h-[360px] overflow-hidden rounded-fs-lg border border-line shadow-fs-sm">
              <SavedSpotsMap spots={visibleSpots} />
            </div>
          ) : (
            <ul className="grid gap-3">
              {visibleSpots.map((spot) => (
                <SavedSpotRow key={spot.spotId} spot={spot} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function SavedSpotRow({ spot }: { spot: SavedSpotView }) {
  const displayName = formatSpotName({
    name: spot.name,
    commune: null,
    waterType: spot.waterType,
  });

  return (
    <li className="relative flex items-center gap-3 rounded-fs-lg border border-line bg-card p-3 shadow-fs-sm">
      <Link
        href={`/spots/${spot.slug}`}
        aria-label={`Voir la fiche : ${displayName}`}
        className="min-w-0 flex-1 rounded-fs-md after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <h2 className="fs-dsp truncate text-[16px] font-bold text-ink">{displayName}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fs-muted">
          {spot.department && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} aria-hidden />
              {getDepartmentName(spot.department)}
            </span>
          )}
          {spot.waterType && (
            <span className="rounded-full bg-aqua-soft px-2 py-0.5 text-xs font-semibold text-teal-deep">
              {WATER_TYPE_LABELS[spot.waterType] ?? spot.waterType}
            </span>
          )}
          {spot.distance !== undefined && (
            <span className="flex items-center gap-1 text-xs">
              <Navigation className="h-3 w-3" strokeWidth={1.9} aria-hidden />
              {formatDistance(spot.distance)}
            </span>
          )}
        </div>
      </Link>

      <a
        href={buildDirectionsUrl(spot.latitude, spot.longitude)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Itinéraire vers ${displayName}`}
        className="relative z-10 inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Navigation className="h-4 w-4" strokeWidth={1.9} aria-hidden />
        <span className="hidden sm:inline">Itinéraire</span>
      </a>
    </li>
  );
}

function EmptyState({ isGuest }: { isGuest: boolean }) {
  return (
    <div className="py-16 text-center">
      <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1.5} aria-hidden />
      <h2 className="mb-2 text-lg font-semibold text-ink">Aucun spot enregistré</h2>
      <p className="mx-auto mb-4 max-w-sm text-fs-muted">
        {isGuest
          ? 'Enregistrez un spot depuis la carte ou une fiche pour le retrouver ici, même sans compte.'
          : 'Parcourez les spots et enregistrez ceux qui vous intéressent pour préparer votre prochaine sortie.'}
      </p>
      <Link href="/spots">
        <Button>Explorer les spots</Button>
      </Link>
    </div>
  );
}

/** Onglet-filtre de collection. `aria-pressed` plutôt que tablist : simple filtre, pas de panneaux. */
function CollectionTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'inline-flex items-center gap-1.5 rounded-full border border-fs-accent bg-fs-accent px-3 py-1 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          : 'inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm font-semibold text-fs-muted transition-colors hover:border-fs-accent hover:text-fs-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      }
    >
      {label}
      <span className={active ? 'text-white/80' : 'text-fs-muted/70'}>{count}</span>
    </button>
  );
}

/**
 * Sélecteur de vue Liste / Carte. `aria-pressed` (deux boutons-bascule), groupés
 * sous un `aria-label` ; ce sont des filtres d'affichage, pas un formulaire radio.
 */
function ViewToggle({ view, onChange }: { view: SavedView; onChange: (v: SavedView) => void }) {
  return (
    <div
      className="inline-flex rounded-md border border-line bg-card p-0.5"
      role="group"
      aria-label="Affichage des spots enregistrés"
    >
      <ViewToggleButton
        active={view === 'list'}
        onClick={() => onChange('list')}
        label="Liste"
      >
        <List className="h-4 w-4" strokeWidth={2} aria-hidden />
      </ViewToggleButton>
      <ViewToggleButton
        active={view === 'map'}
        onClick={() => onChange('map')}
        label="Carte"
      >
        <MapIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </ViewToggleButton>
    </div>
  );
}

function ViewToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Vue ${label}`}
      className={
        active
          ? 'inline-flex items-center gap-1.5 rounded-[5px] bg-fs-accent px-2.5 py-1 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          : 'inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-sm font-semibold text-fs-muted transition-colors hover:text-fs-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      }
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** Limite Google Maps : origine + 9 waypoints intermédiaires + destination. */
const MAX_TRIP_STOPS = 10;

/**
 * Itinéraire multi-arrêts Google Maps (`dir/`). On laisse l'origine à Google
 * (position courante) et on enchaîne les spots enregistrés dans l'ordre affiché
 * (donc trié par distance si la géoloc est accordée). `null` si aucun spot.
 */
function buildTripUrl(spots: SavedSpotView[]): string | null {
  if (spots.length === 0) return null;

  const stops = spots.slice(0, MAX_TRIP_STOPS);
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
  });
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map((s) => `${s.latitude},${s.longitude}`).join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
