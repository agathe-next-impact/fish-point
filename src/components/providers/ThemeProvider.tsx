'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUserStore } from '@/store/user.store';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useUserStore((s) => s.preferences.theme);
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    if (preference === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(systemDark ? 'dark' : 'light');
    } else {
      setThemeState(preference);
    }
  }, [preference]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    useUserStore.getState().setPreference('theme', t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
