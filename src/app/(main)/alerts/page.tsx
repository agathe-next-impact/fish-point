'use client';

import { useState } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { AlertSubscriptionList } from '@/components/alerts/AlertSubscriptionList';
import { CreateAlertForm } from '@/components/alerts/CreateAlertForm';
import { useNotifications } from '@/hooks/useAlerts';

export default function AlertsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();

  const recentNotifications = notifications?.slice(0, 10) ?? [];
  const unreadCount = notifications?.filter((n: { isRead: boolean }) => !n.isRead).length ?? 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alertes intelligentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez des alertes pour ne jamais manquer les meilleures conditions.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Creer une alerte
        </Button>
      </div>

      {/* Subscriptions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Mes alertes</h2>
        <AlertSubscriptionList />
      </section>

      {/* Recent notifications */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Notifications recentes</h2>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount}</Badge>
          )}
        </div>

        {notificationsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">Aucune notification.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((notification: {
              id: string;
              type: string;
              title: string;
              body: string;
              isRead: boolean;
              createdAt: string;
            }) => (
              <Card
                key={notification.id}
                className={notification.isRead ? 'opacity-70' : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      notification.isRead ? 'bg-muted' : 'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Create alert modal */}
      <Modal open={showCreateForm} onOpenChange={setShowCreateForm}>
        <ModalContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Creer une alerte</ModalTitle>
            <ModalDescription>
              Choisissez le type d&apos;alerte et configurez les parametres.
            </ModalDescription>
          </ModalHeader>
          <CreateAlertForm onSuccess={() => setShowCreateForm(false)} />
        </ModalContent>
      </Modal>
    </div>
  );
}
