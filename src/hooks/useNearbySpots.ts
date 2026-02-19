'use client';

import { useQuery } from '@tanstack/react-query';
import type { SpotListItem } from '@/types/spot';

async function fetchNearbySpots(
  lat: number,
  lng: number,
  radius: number = 10000,
  limit: number = 50,
): Promise<SpotListItem[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`/api/spots/nearby?${params}`);
  if (!res.ok) throw new Error('Failed to fetch nearby spots');
  const json = await res.json();
  return json.data;
}

export function useNearbySpots(
  lat: number | null,
  lng: number | null,
  radius: number = 10000,
  limit: number = 50,
) {
  return useQuery({
    queryKey: ['nearbySpots', lat, lng, radius, limit],
    queryFn: () => fetchNearbySpots(lat!, lng!, radius, limit),
    enabled: lat !== null && lng !== null,
    staleTime: 120000,
  });
}
