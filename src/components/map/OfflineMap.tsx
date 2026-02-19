'use client';

import { useOffline } from '@/hooks/useOffline';
import { WifiOff } from 'lucide-react';

export function OfflineMap() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
      <WifiOff className="h-4 w-4" />
      Mode hors ligne - Données mises en cache
    </div>
  );
}
