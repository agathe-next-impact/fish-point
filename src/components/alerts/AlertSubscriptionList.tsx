'use client';

import { useAlertSubscriptions } from '@/hooks/useAlerts';
import { AlertCard } from './AlertCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

export function AlertSubscriptionList() {
  const { data: subscriptions, isLoading, error } = useAlertSubscriptions();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Erreur lors du chargement des alertes.</p>
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Aucune alerte configuree.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Creez votre premiere alerte pour etre notifie des meilleures conditions de peche.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((subscription) => (
        <AlertCard key={subscription.id} subscription={subscription} />
      ))}
    </div>
  );
}
