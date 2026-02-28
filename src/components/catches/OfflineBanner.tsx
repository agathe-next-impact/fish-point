'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';

export function OfflineBanner() {
  const { pendingCount, isSyncing, syncNow } = useOfflineSync();

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
          />
        </svg>
        <span>
          {pendingCount} capture{pendingCount > 1 ? 's' : ''} en attente de synchronisation
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={syncNow}
        isLoading={isSyncing}
        className="flex-shrink-0"
      >
        Synchroniser
      </Button>
    </div>
  );
}
