'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSpot, getSpotBySlug, getSpots } from '@/services/spots.service';
import type { SpotCreateInput, SpotFilters } from '@/types/spot';

export function useSpots(filters: SpotFilters & { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['spots', filters],
    queryFn: () => getSpots(filters),
    staleTime: 60000,
  });
}

export function useSpot(slug: string) {
  return useQuery({
    queryKey: ['spot', slug],
    queryFn: () => getSpotBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SpotCreateInput) => createSpot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spots'] });
    },
  });
}
