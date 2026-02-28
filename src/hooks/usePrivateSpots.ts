'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyPrivateSpots,
  getPrivateSpot,
  createPrivateSpot,
  updatePrivateSpot,
  deletePrivateSpot,
  getPrivateSpotsBbox,
  logVisit,
} from '@/services/private-spots.service';
import type { CreatePrivateSpotInput, UpdatePrivateSpotInput, CreateVisitInput } from '@/validators/private-spot.schema';

export function useMyPrivateSpots(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['private-spots', page, limit],
    queryFn: () => getMyPrivateSpots(page, limit),
  });
}

export function usePrivateSpot(id: string) {
  return useQuery({
    queryKey: ['private-spot', id],
    queryFn: () => getPrivateSpot(id),
    enabled: !!id,
  });
}

export function usePrivateSpotsBbox(bbox: { north: number; south: number; east: number; west: number } | null) {
  return useQuery({
    queryKey: ['private-spots-bbox', bbox],
    queryFn: () => getPrivateSpotsBbox(bbox!),
    enabled: bbox !== null,
  });
}

export function useCreatePrivateSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrivateSpotInput) => createPrivateSpot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-spots'] });
    },
  });
}

export function useUpdatePrivateSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrivateSpotInput }) => updatePrivateSpot(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['private-spots'] });
      queryClient.invalidateQueries({ queryKey: ['private-spot', variables.id] });
    },
  });
}

export function useDeletePrivateSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePrivateSpot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-spots'] });
    },
  });
}

export function useLogVisit(spotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVisitInput) => logVisit(spotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-spot', spotId] });
    },
  });
}
