import { create } from 'zustand';

// ---------------------------------------------------------------------------
// State & actions
// ---------------------------------------------------------------------------

interface OfflineState {
  isOnline: boolean;
  pendingCatchCount: number;
  lastSyncAt: string | null;
}

interface OfflineActions {
  setOnline: (online: boolean) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  setLastSync: (date: string | null) => void;
}

export type OfflineStore = OfflineState & OfflineActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useOfflineStore = create<OfflineStore>((set) => ({
  // -- State ----------------------------------------------------------------
  isOnline: true,
  pendingCatchCount: 0,
  lastSyncAt: null,

  // -- Actions --------------------------------------------------------------

  setOnline: (online) => set({ isOnline: online }),

  incrementPending: () =>
    set((state) => ({ pendingCatchCount: state.pendingCatchCount + 1 })),

  decrementPending: () =>
    set((state) => ({
      pendingCatchCount: Math.max(0, state.pendingCatchCount - 1),
    })),

  setLastSync: (date) => set({ lastSyncAt: date }),
}));
