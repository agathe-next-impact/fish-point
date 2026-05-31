'use client';

import { useQuery } from '@tanstack/react-query';
import { getNearbySpots } from '@/services/spots.service';
import type { SpotFilters } from '@/types/spot';

export function useNearbySpots(
  lat: number | null,
  lng: number | null,
  radius: number = 10000,
  limit: number = 50,
  filters?: SpotFilters,
) {
  return useQuery({
    queryKey: ['nearbySpots', lat, lng, radius, limit, filters],
    queryFn: async () => {
      const response = await getNearbySpots({ lat: lat!, lng: lng!, radius, limit, filters });
      return response.data ?? [];
    },
    enabled: lat !== null && lng !== null,
    staleTime: 120000,
  });
}
