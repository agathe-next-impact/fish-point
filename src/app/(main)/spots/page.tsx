'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SpotCard } from '@/components/spots/SpotCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterRail } from '@/components/filters/FilterRail';
import { EMPTY_FILTERS, type GridFilters } from '@/components/spots/SpotGridFilters';
import { useInfiniteSpots } from '@/hooks/useSpots';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { WaterType, WaterCategory } from '@/types/spot';

export default function SpotsPage() {
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
    limit: 60,
  }), [debouncedSearch, gridFilters]);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteSpots(apiFilters);

  const allSpots = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="container mx-auto px-4 py-7">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="fs-dsp text-[2rem] font-extrabold text-ink">Spots de pêche</h1>
          <p className="mt-1 text-sm text-fs-muted">
            {total} spot{total > 1 ? 's' : ''} correspond{total > 1 ? 'ent' : ''} à vos filtres
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fs-muted" />
            <Input
              placeholder="Rechercher un spot..."
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
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {/* grid / map segmented toggle */}
          <div className="flex shrink-0 items-center rounded-fs-md border border-line bg-card p-0.5">
            <button
              type="button"
              aria-pressed
              className="flex h-8 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground"
              aria-label="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <Link
              href="/map"
              className="flex h-8 w-9 items-center justify-center rounded-[10px] text-fs-muted hover:text-ink"
              aria-label="Vue carte"
            >
              <MapIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Filter rail — sticky on desktop, collapsible on mobile */}
        <div className={cn('mb-6 lg:mb-0 lg:block', showFilters ? 'block' : 'hidden')}>
          <div className="rounded-fs-lg border border-line bg-card p-5 shadow-fs-sm lg:sticky lg:top-20 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <FilterRail filters={gridFilters} onChange={setGridFilters} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {isLoading ? (
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
            <div className="py-16 text-center text-fs-muted">
              <p className="text-lg">Aucun spot trouvé</p>
              {search && <p className="mt-1 text-sm">Essayez avec d&apos;autres termes de recherche</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
