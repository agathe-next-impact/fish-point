import type { AlertSubscriptionData } from '@/types/alert';
import type { ApiResponse } from '@/types/api';

const BASE_URL = '/api/alerts/subscriptions';

export async function getAlertSubscriptions(): Promise<ApiResponse<AlertSubscriptionData[]>> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch alert subscriptions');
  return res.json();
}

export async function createAlertSubscription(data: {
  type: string;
  spotId?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
}): Promise<ApiResponse<AlertSubscriptionData>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create subscription' }));
    throw new Error(err.error || 'Failed to create subscription');
  }
  return res.json();
}

export async function updateAlertSubscription(
  id: string,
  data: {
    type?: string;
    spotId?: string;
    config?: Record<string, unknown>;
    isActive?: boolean;
  },
): Promise<ApiResponse<AlertSubscriptionData>> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update subscription' }));
    throw new Error(err.error || 'Failed to update subscription');
  }
  return res.json();
}

export async function deleteAlertSubscription(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete subscription');
}

export async function getNotifications(): Promise<ApiResponse<Array<{
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}>>> {
  const res = await fetch('/api/alerts/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}
