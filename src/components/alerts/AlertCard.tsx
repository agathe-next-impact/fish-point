'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Bell, BellOff, Droplets, Shield, MapPin, Zap } from 'lucide-react';
import { useUpdateAlertSubscription, useDeleteAlertSubscription } from '@/hooks/useAlerts';
import type { AlertSubscriptionData, AlertType } from '@/types/alert';

const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: typeof Bell; color: string }> = {
  IDEAL_CONDITIONS: {
    label: 'Conditions ideales',
    icon: Zap,
    color: 'text-green-600 dark:text-green-400',
  },
  REGULATION_REMINDER: {
    label: 'Rappel reglementaire',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
  },
  WATER_LEVEL_ABNORMAL: {
    label: "Niveau d'eau anormal",
    icon: Droplets,
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  CUSTOM_SPOT_ACTIVITY: {
    label: 'Activite sur un spot',
    icon: MapPin,
    color: 'text-orange-600 dark:text-orange-400',
  },
};

interface AlertCardProps {
  subscription: AlertSubscriptionData;
}

export function AlertCard({ subscription }: AlertCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const updateMutation = useUpdateAlertSubscription();
  const deleteMutation = useDeleteAlertSubscription();

  const config = ALERT_TYPE_CONFIG[subscription.type];
  const Icon = config.icon;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await updateMutation.mutateAsync({
        id: subscription.id,
        data: { isActive: !subscription.isActive },
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Supprimer cette alerte ?')) {
      deleteMutation.mutate(subscription.id);
    }
  };

  const lastTriggered = subscription.lastTriggered
    ? new Date(subscription.lastTriggered).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Card className={!subscription.isActive ? 'opacity-60' : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-0.5 ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{config.label}</span>
                <Badge variant={subscription.isActive ? 'success' : 'secondary'} className="text-xs">
                  {subscription.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {subscription.spot && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {subscription.spot.name}
                </p>
              )}

              {subscription.type === 'IDEAL_CONDITIONS' && subscription.config && (
                <p className="text-xs text-muted-foreground mt-1">
                  Seuil: {(subscription.config as Record<string, unknown>).threshold as number ?? 75}/100
                </p>
              )}

              {lastTriggered && (
                <p className="text-xs text-muted-foreground mt-1">
                  Derniere alerte: {lastTriggered}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              disabled={isToggling}
              title={subscription.isActive ? 'Desactiver' : 'Activer'}
            >
              {subscription.isActive ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
