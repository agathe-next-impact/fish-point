'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SpotCard } from '@/components/spots/SpotCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpots } from '@/hooks/useSpots';
import { useDebounce } from '@/hooks/useDebounce';

export default function SpotsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useSpots({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>

          {data.meta.hasMore && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => setPage(page + 1)}>
                Charger plus
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
