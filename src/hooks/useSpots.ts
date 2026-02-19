'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SpotListItem, SpotDetail, SpotCreateInput, SpotFilters } from '@/types/spot';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

async function fetchSpots(filters: SpotFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<SpotListItem>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    }
  });

  const res = await fetch(`/api/spots?${params}`);
  if (!res.ok) throw new Error('Failed to fetch spots');
  return res.json();
}

async function fetchSpot(slug: string): Promise<ApiResponse<SpotDetail>> {
  const res = await fetch(`/api/spots/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch spot');
  return res.json();
}

async function createSpot(data: SpotCreateInput): Promise<ApiResponse<SpotDetail>> {
  const res = await fetch('/api/spots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create spot');
  return res.json();
}

export function useSpots(filters: SpotFilters & { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['spots', filters],
    queryFn: () => fetchSpots(filters),
    staleTime: 60000,
  });
}

export function useSpot(slug: string) {
  return useQuery({
    queryKey: ['spot', slug],
    queryFn: () => fetchSpot(slug),
    enabled: !!slug,
  });
}

export function useCreateSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spots'] });
    },
  });
}
