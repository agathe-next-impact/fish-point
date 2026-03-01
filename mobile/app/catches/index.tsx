import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Fish, Plus } from 'lucide-react-native';
import { colors, spacing, typography, SCREEN_PADDING_H } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CatchCard } from '@/components/catches/CatchCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useCatches } from '@/hooks';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CatchesListScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useCatches();

  const catches = data?.data ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Mes captures"
        showBack
        rightAction={
          <Button
            title=""
            variant="ghost"
            size="sm"
            onPress={() => router.push('/catches/new')}
            icon={<Plus size={22} color={colors.primary[600]} />}
          />
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen message="Chargement des captures..." />
      ) : (
        <FlatList
          data={catches}
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
            <CatchCard
              id={item.id}
              species={(item as any).species ?? null}
              weight={item.weight ?? null}
              length={item.length ?? null}
              photoUrl={(item as any).photoUrl ?? null}
              spotName={(item as any).spot?.name ?? null}
              createdAt={item.caughtAt}
              technique={(item as any).technique ?? null}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Fish size={48} color={colors.gray[300]} />}
              title="Aucune capture"
              description="Enregistrez votre premiere prise pour commencer a suivre vos statistiques."
              action={
                <Button
                  title="Ajouter une capture"
                  onPress={() => router.push('/catches/new')}
                  icon={<Plus size={18} color={colors.white} />}
                />
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
});
