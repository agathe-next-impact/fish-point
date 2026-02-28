export type AlertType = 'IDEAL_CONDITIONS' | 'REGULATION_REMINDER' | 'WATER_LEVEL_ABNORMAL' | 'CUSTOM_SPOT_ACTIVITY';

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

export interface AlertEvaluationResult {
  type: AlertType;
  spotId?: string;
  spotName?: string;
  title: string;
  body: string;
  score?: number;
}

export interface AlertRunSummary {
  usersProcessed: number;
  alertsTriggered: number;
  errors: number;
  details: {
    idealConditions: number;
    waterLevel: number;
    regulations: number;
  };
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

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  IDEAL_CONDITIONS: 'Conditions ideales',
  REGULATION_REMINDER: 'Rappel reglementaire',
  WATER_LEVEL_ABNORMAL: "Niveau d'eau anormal",
  CUSTOM_SPOT_ACTIVITY: 'Activite sur un spot',
};

export const ALERT_TYPE_DESCRIPTIONS: Record<AlertType, string> = {
  IDEAL_CONDITIONS: 'Recevez une alerte quand les conditions de peche sont excellentes sur vos spots favoris.',
  REGULATION_REMINDER: 'Soyez prevenu des changements de reglementation et de l\'expiration de votre carte de peche.',
  WATER_LEVEL_ABNORMAL: 'Alerte en cas de niveau d\'eau anormal (crue ou etiage) sur vos spots.',
  CUSTOM_SPOT_ACTIVITY: 'Notification quand il y a de l\'activite (prises, avis) sur un spot specifique.',
};
