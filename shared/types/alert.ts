import type { AlertType } from '../constants/enums';

export interface AlertSubscriptionData {
  id: string;
  type: AlertType;
  spotId: string | null;
  spot: {
    id: string;
    name: string;
    slug: string;
  } | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}
