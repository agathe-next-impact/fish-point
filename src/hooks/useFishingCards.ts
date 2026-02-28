'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyFishingCards,
  getFishingCard,
  createFishingCard,
  updateFishingCard,
  deleteFishingCard,
} from '@/services/fishing-cards.service';
import type { FishingCardCreateInput, FishingCardUpdateInput } from '@/types/fishing-card';

export function useMyFishingCards() {
  return useQuery({
    queryKey: ['fishing-cards'],
    queryFn: getMyFishingCards,
  });
}

export function useFishingCard(id: string) {
  return useQuery({
    queryKey: ['fishing-card', id],
    queryFn: () => getFishingCard(id),
    enabled: !!id,
  });
}

export function useCreateFishingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FishingCardCreateInput) => createFishingCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fishing-cards'] });
    },
  });
}

export function useUpdateFishingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FishingCardUpdateInput }) =>
      updateFishingCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fishing-cards'] });
    },
  });
}

export function useDeleteFishingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFishingCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fishing-cards'] });
    },
  });
}
