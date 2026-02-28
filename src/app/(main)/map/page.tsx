'use client';

import dynamic from 'next/dynamic';
import { useMapSpots } from '@/hooks/useMapSpots';
import { usePrivateSpotsBbox } from '@/hooks/usePrivateSpots';
import { useMapStore } from '@/store/map.store';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> },
);

export default function MapPage() {
  const { spots, setBounds } = useMapSpots();
  const { data: session } = useSession();
  const activeLayers = useMapStore((s) => s.activeLayers);
  const [privateBounds, setPrivateBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  const isAuthenticated = !!session?.user?.id;
  const showPrivateSpots = isAuthenticated && activeLayers.includes('privateSpots');

  const { data: privateSpotsData } = usePrivateSpotsBbox(showPrivateSpots ? privateBounds : null);

  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setBounds(bounds);
    setPrivateBounds(bounds);
  }, [setBounds]);

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      <MapContainer
        spots={spots}
        privateSpots={privateSpotsData?.data ?? []}
        onBoundsChange={handleBoundsChange}
      />
    </div>
  );
}
