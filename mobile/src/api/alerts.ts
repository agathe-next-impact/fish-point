import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type {
  AlertSubscriptionData,
  NotificationData,
  ApiResponse,
} from '@fish-point/shared';
import type { AlertType } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateSubscriptionInput {
  type: AlertType;
  spotId?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateSubscriptionInput {
  type?: AlertType;
  spotId?: string | null;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Alerts API
// ---------------------------------------------------------------------------

/** GET /api/alerts/subscriptions – List the current user's alert subscriptions */
export function getSubscriptions(): Promise<ApiResponse<AlertSubscriptionData[]>> {
  return apiGet<ApiResponse<AlertSubscriptionData[]>>('/api/alerts/subscriptions');
}

/** POST /api/alerts/subscriptions – Create a new alert subscription */
export function createSubscription(
  data: CreateSubscriptionInput,
): Promise<ApiResponse<AlertSubscriptionData>> {
  return apiPost<ApiResponse<AlertSubscriptionData>>('/api/alerts/subscriptions', data);
}

/** PATCH /api/alerts/subscriptions/{id} – Update an existing subscription */
export function updateSubscription(
  id: string,
  data: UpdateSubscriptionInput,
): Promise<ApiResponse<AlertSubscriptionData>> {
  return apiPatch<ApiResponse<AlertSubscriptionData>>(`/api/alerts/subscriptions/${id}`, data);
}

/** DELETE /api/alerts/subscriptions/{id} – Remove a subscription */
export function deleteSubscription(id: string): Promise<ApiResponse<null>> {
  return apiDelete<ApiResponse<null>>(`/api/alerts/subscriptions/${id}`);
}

/** GET /api/alerts/notifications – Get the current user's notifications */
export function getNotifications(): Promise<ApiResponse<NotificationData[]>> {
  return apiGet<ApiResponse<NotificationData[]>>('/api/alerts/notifications');
}
