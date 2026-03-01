import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useOfflineStore } from '../stores/offline.store';
import {
  getPendingCatches,
  removePendingCatch,
  getPendingCatchCount,
} from '../utils/offline-db';
import { syncOfflineCatches } from '../api/catches';
import type { CatchCreateExtendedInput } from '../api/catches';

// ---------------------------------------------------------------------------
// Connectivity check
// ---------------------------------------------------------------------------

/** Lightweight reachability probe (HEAD request to the API). */
async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    await fetch(
      `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/health`,
      { method: 'HEAD', signal: controller.signal },
    );

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Watches network reachability and automatically syncs pending catches
 * when connectivity is restored.
 *
 * Place this hook once, near the top of the authenticated layout so it
 * lives for the entire authenticated session.
 */
export function useOfflineSync() {
  const { isOnline, setOnline, setLastSync } = useOfflineStore();
  const isSyncing = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // -----------------------------------------------------------------------
  // Sync logic
  // -----------------------------------------------------------------------

  const syncPendingCatches = useCallback(async (): Promise<void> => {
    if (isSyncing.current) return;

    const pending = getPendingCatches();
    if (pending.length === 0) return;

    isSyncing.current = true;

    try {
      const catchPayloads: CatchCreateExtendedInput[] = pending.map((p) => ({
        ...(p.data as unknown as CatchCreateExtendedInput),
        clientId: p.clientId,
      }));

      const result = await syncOfflineCatches(catchPayloads);

      // Remove successfully synced catches from the local store
      if (result.synced > 0) {
        for (const p of pending) {
          removePendingCatch(p.clientId);
        }
      }

      setLastSync(new Date().toISOString());
    } catch {
      // Sync failed -- catches remain in the local DB for the next attempt.
    } finally {
      isSyncing.current = false;
    }
  }, [setLastSync]);

  // -----------------------------------------------------------------------
  // Connectivity polling
  // -----------------------------------------------------------------------

  const runConnectivityCheck = useCallback(async () => {
    const online = await checkConnectivity();
    const wasOffline = !useOfflineStore.getState().isOnline;

    setOnline(online);

    // Transition from offline -> online: trigger sync
    if (online && wasOffline) {
      await syncPendingCatches();
    }
  }, [setOnline, syncPendingCatches]);

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  useEffect(() => {
    // Initial check
    runConnectivityCheck();

    // Poll every 15 seconds
    pollTimer.current = setInterval(runConnectivityCheck, 15_000);

    // Also check when the app comes back to the foreground
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          runConnectivityCheck();
        }
      },
    );

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      subscription.remove();
    };
  }, [runConnectivityCheck]);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    isOnline,
    pendingCount: getPendingCatchCount(),
    syncNow: syncPendingCatches,
  };
}
