'use client';

import { useSyncExternalStore } from 'react';

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOffline(): boolean {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    () => !navigator.onLine,
    () => false,
  );
}
