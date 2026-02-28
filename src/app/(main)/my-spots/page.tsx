'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivateSpotCard } from '@/components/private-spots/PrivateSpotCard';
import { useMyPrivateSpots } from '@/hooks/usePrivateSpots';

export default function MySpotsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useMyPrivateSpots(page, limit);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Mes spots prives</h1>
        </div>
        <Link href="/my-spots/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Ajouter un spot prive
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="text-center py-16">
          <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Aucun spot prive</h2>
          <p className="text-muted-foreground mb-4">
            Enregistrez vos coins de peche secrets pour les retrouver facilement.
          </p>
          <Link href="/my-spots/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Ajouter mon premier spot
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((spot) => (
              <PrivateSpotCard key={spot.id} spot={spot} />
            ))}
          </div>

          {data.meta.hasMore && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Precedent
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                disabled={!data.meta.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
