'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SpotCard } from '@/components/spots/SpotCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterRail } from '@/components/filters/FilterRail';
import { ExplorerViewToggle } from '@/components/explore/ExplorerViewToggle';
import { SearchThisAreaButton } from '@/components/explore/SearchThisAreaButton';
import { SpotsEmptyState } from '@/components/explore/SpotsEmptyState';
import { EMPTY_FILTERS, type GridFilters } from '@/components/spots/SpotGridFilters';
import { useInfiniteSpots, useSpots } from '@/hooks/useSpots';
import { useMapSpots } from '@/hooks/useMapSpots';
import { usePrivateSpotsBbox } from '@/hooks/usePrivateSpots';
import { useMapStore } from '@/store/map.store';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { SpotQueryFilters } from '@/lib/spot-filter-params';
import type { WaterType, WaterCategory } from '@/types/spot';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-fs-lg" /> },
);

type Bounds = { north: number; south: number; east: number; west: number };

/** Deux zones sont équivalentes si leurs quatre bornes sont identiques. */
function boundsEqual(a: Bounds | null, b: Bounds | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.north === b.north && a.south === b.south && a.east === b.east && a.west === b.west;
}

export default function ExplorerPage() {
  const { data: session } = useSession();
  const explorerView = useMapStore((s) => s.explorerView);
  const setExplorerView = useMapStore((s) => s.setExplorerView);
  const activeLayers = useMapStore((s) => s.activeLayers);
  const committedBounds = useMapStore((s) => s.committedBounds);
  const pendingBounds = useMapStore((s) => s.pendingBounds);
  const setPendingBounds = useMapStore((s) => s.setPendingBounds);
  const commitBounds = useMapStore((s) => s.commitBounds);
  const clearCommittedBounds = useMapStore((s) => s.clearCommittedBounds);

  const [search, setSearch] = useState('');
  const [gridFilters, setGridFilters] = useState<GridFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const apiFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    department: gridFilters.department,
    waterType: gridFilters.waterType.length > 0
      ? (gridFilters.waterType as WaterType[])
      : undefined,
    waterCategory: gridFilters.waterCategory as WaterCategory | undefined,
    fishCategory: gridFilters.fishCategory.length > 0
      ? gridFilters.fishCategory
      : undefined,
    accessType: gridFilters.accessType,
    minFishabilityScore: gridFilters.minFishabilityScore,
    maxFishabilityScore: gridFilters.maxFishabilityScore,
    // ── Filtres « sortie » : intention de pêche, pas seulement un lieu ──
    species: gridFilters.species.length > 0
      ? gridFilters.species.map((s) => s.id)
      : undefined,
    fishingMode: gridFilters.fishingMode.length > 0 ? gridFilters.fishingMode : undefined,
    fishingTechnique: gridFilters.fishingTechnique.length > 0
      ? gridFilters.fishingTechnique
      : undefined,
    parking: gridFilters.parking,
    boatLaunch: gridFilters.boatLaunch,
    pmr: gridFilters.pmr,
    nightFishing: gridFilters.nightFishing,
    // Distance « autour de moi » : la bbox carte committée prime côté serveur.
    lat: gridFilters.lat,
    lng: gridFilters.lng,
    radius: gridFilters.radius,
    // Borne la liste à la même zone que la carte (zone committée partagée via le
    // store). `null` = aucune zone validée → liste non bornée (filtres globaux).
    north: committedBounds?.north,
    south: committedBounds?.south,
    east: committedBounds?.east,
    west: committedBounds?.west,
    limit: 60,
  }), [debouncedSearch, gridFilters, committedBounds]);

  // Sous-ensemble « sortie » envoyé AUX TUILES MVT de la carte : exactement les mêmes
  // filtres que la liste (source d'état unifiée `gridFilters`). On exclut les bornes géo
  // et la pagination — la tuile borne déjà géographiquement (z/x/y). C'est ce qui aligne
  // les marqueurs de la carte sur la liste (fin de la divergence carte ↔ liste).
  const mapFilters = useMemo<SpotQueryFilters>(() => ({
    search: debouncedSearch || undefined,
    department: gridFilters.department,
    waterType: gridFilters.waterType.length > 0 ? gridFilters.waterType : undefined,
    waterCategory: gridFilters.waterCategory,
    fishCategory: gridFilters.fishCategory.length > 0 ? gridFilters.fishCategory : undefined,
    accessType: gridFilters.accessType,
    minFishabilityScore: gridFilters.minFishabilityScore,
    maxFishabilityScore: gridFilters.maxFishabilityScore,
    species: gridFilters.species.length > 0
      ? gridFilters.species.map((s) => s.id)
      : undefined,
    fishingMode: gridFilters.fishingMode.length > 0 ? gridFilters.fishingMode : undefined,
    fishingTechnique: gridFilters.fishingTechnique.length > 0
      ? gridFilters.fishingTechnique
      : undefined,
    parking: gridFilters.parking,
    boatLaunch: gridFilters.boatLaunch,
    pmr: gridFilters.pmr,
    nightFishing: gridFilters.nightFishing,
  }), [debouncedSearch, gridFilters]);

  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteSpots(apiFilters);

  const allSpots = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  // Contexte de l'état « 0 spot » : on distingue ce qui borne réellement la liste
  // pour proposer la bonne sortie (élargir la zone vs relâcher les filtres).
  const isAreaRestricted = committedBounds !== null;
  const hasActiveFilters =
    !!gridFilters.department ||
    gridFilters.waterType.length > 0 ||
    !!gridFilters.waterCategory ||
    gridFilters.fishCategory.length > 0 ||
    !!gridFilters.accessType ||
    gridFilters.species.length > 0 ||
    gridFilters.fishingMode.length > 0 ||
    gridFilters.fishingTechnique.length > 0 ||
    gridFilters.parking === true ||
    gridFilters.boatLaunch === true ||
    gridFilters.pmr === true ||
    gridFilters.nightFishing === true ||
    (gridFilters.lat !== undefined && gridFilters.lng !== undefined) ||
    gridFilters.minFishabilityScore !== undefined;
  const isListEmpty = !isLoading && allSpots.length === 0;

  // Comptage des spots existant SANS la zone courante (mêmes filtres, sans bbox).
  // Déclenché uniquement quand la liste committée est vide ET bornée : sert à
  // afficher « N spots ailleurs en France ». Réutilise /api/spots, aucune route ajoutée.
  const elsewhereFilters = useMemo(
    () => ({
      ...apiFilters,
      north: undefined,
      south: undefined,
      east: undefined,
      west: undefined,
      limit: 1,
    }),
    [apiFilters],
  );
  const { data: elsewhereData } = useSpots(elsewhereFilters, {
    enabled: isListEmpty && isAreaRestricted,
  });
  const spotsElsewhere = elsewhereData?.meta.total;

  // Vue carte : bbox spots (couches heatmap/fishability) + spots privés authentifiés.
  const isAuthenticated = !!session?.user?.id;
  const showPrivateSpots = isAuthenticated && activeLayers.includes('privateSpots');
  const needsBboxSpots = activeLayers.includes('heatmap') || activeLayers.includes('fishability');
  const isMapView = explorerView === 'map';

  const { spots: bboxSpots, setBounds, isFetching: isBboxFetching } = useMapSpots({
    enabled: isMapView && needsBboxSpots,
  });
  const [privateBounds, setPrivateBounds] = useState<Bounds | null>(null);
  const { data: privateSpotsData } = usePrivateSpotsBbox(
    isMapView && showPrivateSpots ? privateBounds : null,
  );

  const handleBoundsChange = useCallback((bounds: Bounds) => {
    // Couches carte (heatmap/fishability/privés) : suivent la fenêtre en continu.
    setBounds(bounds);
    setPrivateBounds(bounds);
    // Zone de recherche partagée : mémorisée « en attente », SANS re-fetch auto.
    // L'utilisateur valide via « Rechercher dans cette zone ».
    setPendingBounds(bounds);
  }, [setBounds, setPendingBounds]);

  // Le bouton n'apparaît qu'après un déplacement réel : zone en attente présente
  // et différente de la zone committée appliquée à la liste et à la carte.
  const canSearchArea = isMapView && pendingBounds !== null && !boundsEqual(pendingBounds, committedBounds);

  return (
    <div className="container mx-auto px-4 py-7">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="fs-dsp text-[2rem] font-extrabold text-ink">Explorer</h1>
          <p className="mt-1 text-sm text-fs-muted">
            {total} spot{total > 1 ? 's' : ''} correspond{total > 1 ? 'ent' : ''} à vos filtres
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fs-muted" />
            <Input
              placeholder="Lieu, plan d'eau ou espèce"
              aria-label="Rechercher un lieu, un plan d'eau ou une espèce"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Filtres"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <ExplorerViewToggle value={explorerView} onChange={setExplorerView} />
        </div>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Filter rail — sticky on desktop, collapsible on mobile. Persists across views. */}
        <div className={cn('mb-6 lg:mb-0 lg:block', showFilters ? 'block' : 'hidden')}>
          <div className="rounded-fs-lg border border-line bg-card p-5 shadow-fs-sm lg:sticky lg:top-20 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <FilterRail filters={gridFilters} onChange={setGridFilters} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {isMapView ? (
            <div className="relative h-[calc(100vh-13rem)] min-h-[420px] overflow-hidden rounded-fs-lg border border-line">
              <MapContainer
                spots={bboxSpots}
                privateSpots={privateSpotsData?.data ?? []}
                onBoundsChange={handleBoundsChange}
                isLoading={needsBboxSpots ? isBboxFetching : false}
                spotFilters={mapFilters}
              />
              <SearchThisAreaButton
                visible={canSearchArea}
                onClick={commitBounds}
                isLoading={isFetching}
              />
              <p className="sr-only" role="status" aria-live="polite">
                {total} spot{total > 1 ? 's' : ''} dans cette zone
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[248px] rounded-fs-lg" />
              ))}
            </div>
          ) : allSpots.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {allSpots.map((spot, i) => (
                  <div key={spot.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 9) * 0.05}s` }}>
                    <SpotCard spot={spot} />
                  </div>
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12">
              <SpotsEmptyState
                isAreaRestricted={isAreaRestricted}
                hasActiveFilters={hasActiveFilters}
                hasSearch={!!debouncedSearch}
                spotsElsewhere={spotsElsewhere}
                onWidenArea={clearCommittedBounds}
                onClearFilters={() => {
                  setGridFilters(EMPTY_FILTERS);
                  setSearch('');
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
