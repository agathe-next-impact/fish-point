import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bell, Plus, Trash2, BellOff } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import {
  useSubscriptions,
  useUpdateSubscription,
  useDeleteSubscription,
  useCreateSubscription,
} from '@/hooks';

// ---------------------------------------------------------------------------
// Alert type labels
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABELS: Record<string, string> = {
  WEATHER: 'Meteo',
  WATER_LEVEL: "Niveau d'eau",
  FISH_ACTIVITY: 'Activite des poissons',
  REGULATION: 'Reglementation',
  COMMUNITY: 'Communaute',
};

function getAlertLabel(type: string): string {
  return ALERT_TYPE_LABELS[type] ?? type;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AlertsScreen() {
  const { data, isLoading, isRefetching, refetch } = useSubscriptions();
  const updateMutation = useUpdateSubscription();
  const deleteMutation = useDeleteSubscription();
  const createMutation = useCreateSubscription();

  const subscriptions = data?.data ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleToggle = (id: string, isActive: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !isActive } });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer',
      'Etes-vous sur de vouloir supprimer cette alerte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ],
    );
  };

  const handleAdd = () => {
    // Simplified: create a default weather subscription
    Alert.alert(
      'Nouvelle alerte',
      'Quel type d\'alerte souhaitez-vous creer ?',
      [
        {
          text: 'Meteo',
          onPress: () =>
            createMutation.mutate({ type: 'WEATHER' as any, isActive: true }),
        },
        {
          text: "Niveau d'eau",
          onPress: () =>
            createMutation.mutate({ type: 'WATER_LEVEL' as any, isActive: true }),
        },
        {
          text: 'Activite poissons',
          onPress: () =>
            createMutation.mutate({ type: 'FISH_ACTIVITY' as any, isActive: true }),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Alertes" showBack />
        <LoadingSpinner fullScreen message="Chargement des alertes..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Alertes"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleAdd}>
            <Plus size={22} color={colors.primary[600]} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View style={styles.alertIcon}>
                <Bell size={20} color={colors.primary[600]} />
              </View>

              <View style={styles.alertInfo}>
                <Text style={styles.alertType}>
                  {getAlertLabel((item as any).type)}
                </Text>
                {(item as any).spot?.name && (
                  <Text style={styles.alertSpot}>{(item as any).spot.name}</Text>
                )}
              </View>

              <Switch
                value={(item as any).isActive ?? true}
                onValueChange={() =>
                  handleToggle(item.id, (item as any).isActive ?? true)
                }
                trackColor={{
                  false: colors.gray[300],
                  true: colors.primary[300],
                }}
                thumbColor={
                  (item as any).isActive ? colors.primary[600] : colors.gray[100]
                }
              />

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Trash2 size={18} color={colors.error[500]} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<BellOff size={48} color={colors.gray[300]} />}
            title="Aucune alerte"
            description="Configurez des alertes pour etre notifie des conditions ideales de peche."
            action={
              <Button
                title="Ajouter une alerte"
                onPress={handleAdd}
                icon={<Plus size={18} color={colors.white} />}
              />
            }
          />
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  alertCard: {
    marginBottom: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  alertSpot: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: spacing.xxs,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});
