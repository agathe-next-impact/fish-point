import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AlertSubscriptionData,
  NotificationData,
  ApiResponse,
} from '@fish-point/shared';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '../api/alerts';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getNotifications,
} from '../api/alerts';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const alertKeys = {
  all: ['alerts'] as const,
  subscriptions: () => [...alertKeys.all, 'subscriptions'] as const,
  notifications: () => [...alertKeys.all, 'notifications'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch the current user's alert subscriptions. */
export function useSubscriptions() {
  return useQuery<ApiResponse<AlertSubscriptionData[]>>({
    queryKey: alertKeys.subscriptions(),
    queryFn: () => getSubscriptions(),
  });
}

/** Fetch the current user's notifications. */
export function useNotifications() {
  return useQuery<ApiResponse<NotificationData[]>>({
    queryKey: alertKeys.notifications(),
    queryFn: () => getNotifications(),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new alert subscription. */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<AlertSubscriptionData>, Error, CreateSubscriptionInput>({
    mutationFn: (data) => createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.subscriptions() });
    },
  });
}

/** Update an existing alert subscription. */
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<AlertSubscriptionData>,
    Error,
    { id: string; data: UpdateSubscriptionInput }
  >({
    mutationFn: ({ id, data }) => updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.subscriptions() });
    },
  });
}

/** Delete an alert subscription. */
export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.subscriptions() });
    },
  });
}
