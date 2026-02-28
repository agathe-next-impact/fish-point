'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SharedCatchCard } from '@/components/community/SharedCatchCard';
import { ShareCatchDialog } from '@/components/community/ShareCatchDialog';
import { usePublicFeed } from '@/hooks/useFeed';

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePublicFeed(page);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fil communautaire</h1>
        <ShareCatchDialog />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">Aucune prise partagée pour le moment.</p>
          <p className="text-sm text-muted-foreground">
            Soyez le premier à partager une prise avec la communauté !
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data?.data?.map((item) => (
              <SharedCatchCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {data?.meta && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.meta.page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.meta.hasMore}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
