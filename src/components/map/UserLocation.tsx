'use client';

import { Marker } from 'react-map-gl';
import { useGeolocation } from '@/hooks/useGeolocation';

export function UserLocation() {
  const { latitude, longitude } = useGeolocation();

  if (!latitude || !longitude) return null;

  return (
    <Marker latitude={latitude} longitude={longitude} anchor="center">
      <div className="relative">
        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-40" />
      </div>
    </Marker>
  );
}
