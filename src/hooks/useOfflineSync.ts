'use client';

import { useEffect, useCallback } from 'react';
import { getPendingCatches, clearPendingCatches } from '@/lib/offline-db';
import { useOfflineStore } from '@/store/offline.store';

export function useOfflineSync() {
  const { pendingCount, isSyncing, setPendingCount, setIsSyncing, setLastSyncAt } =
    useOfflineStore();

  // Refresh the pending count from IndexedDB
  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await getPendingCatches();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB may not be available (SSR)
    }
  }, [setPendingCount]);

  // Sync all pending catches to the server
  const syncNow = useCallback(async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      const pending = await getPendingCatches();

      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      const catches = pending.map((p) => ({
        ...p.data,
        clientId: p.clientId,
      }));

      const res = await fetch('/api/catches/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catches }),
      });

      if (res.ok) {
        await clearPendingCatches();
        setPendingCount(0);
        setLastSyncAt(new Date());
      }
    } catch {
      // Will retry on next online event
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, setIsSyncing, setPendingCount, setLastSyncAt]);

  // Listen for 'online' event to auto-sync
  useEffect(() => {
    const handleOnline = () => {
      syncNow();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  // Load pending count on mount
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  return { pendingCount, isSyncing, syncNow, refreshPendingCount };
}
