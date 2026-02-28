'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAlertSubscriptions,
  createAlertSubscription,
  updateAlertSubscription,
  deleteAlertSubscription,
} from '@/services/alerts.service';
import { useNotificationStore } from '@/store/notification.store';

export function useAlertSubscriptions() {
  return useQuery({
    queryKey: ['alertSubscriptions'],
    queryFn: async () => {
      const res = await getAlertSubscriptions();
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useCreateAlertSubscription() {
  const queryClient = useQueryClient();
  const addToast = useNotificationStore((s) => s.addToast);

  return useMutation({
    mutationFn: createAlertSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSubscriptions'] });
      addToast({
        type: 'success',
        title: 'Alerte creee',
        description: 'Votre alerte a ete creee avec succes.',
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erreur',
        description: error.message || 'Impossible de creer l\'alerte.',
      });
    },
  });
}

export function useUpdateAlertSubscription() {
  const queryClient = useQueryClient();
  const addToast = useNotificationStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { type?: string; spotId?: string; config?: Record<string, unknown>; isActive?: boolean } }) =>
      updateAlertSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSubscriptions'] });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erreur',
        description: error.message || 'Impossible de mettre a jour l\'alerte.',
      });
    },
  });
}

export function useDeleteAlertSubscription() {
  const queryClient = useQueryClient();
  const addToast = useNotificationStore((s) => s.addToast);

  return useMutation({
    mutationFn: deleteAlertSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSubscriptions'] });
      addToast({
        type: 'success',
        title: 'Alerte supprimee',
        description: 'L\'alerte a ete supprimee.',
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'alerte.',
      });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/alerts/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useFavoriteSpots() {
  return useQuery({
    queryKey: ['favoriteSpots'],
    queryFn: async () => {
      const res = await fetch('/api/spots/favorites');
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const json = await res.json();
      return json.data;
    },
    staleTime: 60000,
  });
}
