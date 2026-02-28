import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  mapStyle: string;
  defaultRadius: number;
  showPremiumSpots: boolean;
  notificationsEnabled: boolean;
}

interface UserState {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  mapStyle: 'streets',
  defaultRadius: 10000,
  showPremiumSpots: true,
  notificationsEnabled: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),
    }),
    {
      name: 'fishspot-user-preferences',
    },
  ),
);
