'use client';

import dynamic from 'next/dynamic';
import { useNearbySpots } from '@/hooks/useNearbySpots';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useMapStore } from '@/store/map.store';
import type { FishingType, WaterType } from '@/types/spot';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> },
);

export default function MapPage() {
  const { latitude, longitude, requestPosition } = useGeolocation();
  const setViewport = useMapStore((s) => s.setViewport);
  const filters = useMapStore((s) => s.filters);
  const spotFilters = {
    waterType: filters.waterTypes as WaterType[],
    fishingTypes: filters.fishingTypes as FishingType[],
    minRating: filters.minRating || undefined,
    pmr: filters.pmr || undefined,
    nightFishing: filters.nightFishing || undefined,
    isPremium: filters.premiumOnly || undefined,
    species: filters.species.length > 0 ? filters.species : undefined,
  };

  const { data: spots = [] } = useNearbySpots(
    latitude,
    longitude,
    filters.radius,
    100,
    spotFilters,
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
