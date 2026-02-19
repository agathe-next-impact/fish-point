'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MapViewport } from '@/types/map';

interface MapContextType {
  viewport: MapViewport;
  setViewport: (viewport: MapViewport) => void;
  selectedSpotId: string | null;
  setSelectedSpotId: (id: string | null) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: 46.603354,
    longitude: 1.888334,
    zoom: 6,
  });
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  return (
    <MapContext.Provider value={{ viewport, setViewport, selectedSpotId, setSelectedSpotId }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}
