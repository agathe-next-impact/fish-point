'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface GeolocationContextType {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  requestPosition: () => void;
}

const GeolocationContext = createContext<GeolocationContextType | null>(null);

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const geolocation = useGeolocation({ watch: false });

  return (
    <GeolocationContext.Provider value={geolocation}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocationContext() {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocationContext must be used within a GeolocationProvider');
  }
  return context;
}
