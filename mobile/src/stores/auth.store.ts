import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

// ---------------------------------------------------------------------------
// State & actions
// ---------------------------------------------------------------------------

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>((set) => ({
  // -- State ----------------------------------------------------------------
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // -- Actions --------------------------------------------------------------

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null });

    // Persist user data so we can restore it on cold start
    if (user) {
      SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user)).catch(
        () => {/* best-effort */},
      );
    } else {
      SecureStore.deleteItemAsync(AUTH_USER_KEY).catch(() => {/* best-effort */});
    }
  },

  setToken: async (token) => {
    if (token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
    set({ token, isAuthenticated: token !== null });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(AUTH_USER_KEY),
      ]);

      if (storedToken) {
        const parsedUser: UserProfile | null = storedUser
          ? (JSON.parse(storedUser) as UserProfile)
          : null;

        set({
          token: storedToken,
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
