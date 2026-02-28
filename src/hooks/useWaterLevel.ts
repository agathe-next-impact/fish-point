'use client';

import { useQuery } from '@tanstack/react-query';
import type { WaterLevelData } from '@/types/weather';

async function fetchWaterLevel(spotId: string): Promise<WaterLevelData | null> {
  const res = await fetch(`/api/water/${spotId}`);
  if (!res.ok) throw new Error('Failed to fetch water level');
  const json = await res.json();
  return json.data;
}

export function useWaterLevel(spotId: string | null) {
  return useQuery({
    queryKey: ['waterLevel', spotId],
    queryFn: () => fetchWaterLevel(spotId!),
    enabled: !!spotId,
    staleTime: 900000,
    refetchInterval: 1800000,
  });
}
