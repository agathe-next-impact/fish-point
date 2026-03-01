'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SpotCard } from '@/components/spots/SpotCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotGridFilters, EMPTY_FILTERS, type GridFilters } from '@/components/spots/SpotGridFilters';
import { useInfiniteSpots } from '@/hooks/useSpots';
import { useDebounce } from '@/hooks/useDebounce';
import type { WaterType, WaterCategory } from '@/types/spot';

export default function SpotsPage() {
  const [search, setSearch] = useState('');
  const [gridFilters, setGridFilters] = useState<GridFilters>(EMPTY_FILTERS);
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
    limit: 500,
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Spots de pêche</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un spot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <SpotGridFilters filters={gridFilters} onChange={setGridFilters} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : allSpots.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {total} spot{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Aucun spot trouvé</p>
          {search && <p className="text-sm mt-1">Essayez avec d&apos;autres termes de recherche</p>}
        </div>
      )}
    </div>
  );
}
