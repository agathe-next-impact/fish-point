'use client';

import dynamic from 'next/dynamic';
import { useNearbySpots } from '@/hooks/useNearbySpots';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useMapStore } from '@/store/map.store';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> },
);

export default function MapPage() {
  const { latitude, longitude, requestPosition } = useGeolocation();
  const setViewport = useMapStore((s) => s.setViewport);
  const filters = useMapStore((s) => s.filters);

  const { data: spots = [] } = useNearbySpots(
    latitude,
    longitude,
    filters.radius,
    100,
  );

  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

  useEffect(() => {
    if (latitude && longitude) {
      setViewport({ latitude, longitude, zoom: 12 });
    }
  }, [latitude, longitude, setViewport]);

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      <MapContainer spots={spots} />
    </div>
  );
}
