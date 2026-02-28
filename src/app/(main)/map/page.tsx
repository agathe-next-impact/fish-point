'use client';

import dynamic from 'next/dynamic';
import { useMapSpots } from '@/hooks/useMapSpots';
import { Skeleton } from '@/components/ui/skeleton';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> },
);

export default function MapPage() {
  const { spots, setBounds } = useMapSpots();

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      <MapContainer spots={spots} onBoundsChange={setBounds} />
    </div>
  );
}
