import { create } from 'zustand';

interface OfflineState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  setPendingCount: (count: number) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  incrementPending: () => void;
  decrementPending: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,

  setPendingCount: (count) => set({ pendingCount: count }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),
  incrementPending: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  decrementPending: () =>
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
}));
