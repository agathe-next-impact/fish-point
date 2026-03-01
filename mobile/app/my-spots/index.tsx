import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MapPinOff, Plus, Eye } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { getPrivateSpots } from '@/api/private-spots';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MySpotsScreen() {
  const router = useRouter();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['private-spots'],
    queryFn: () => getPrivateSpots(),
  });

  const spots = data?.data ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Mes spots prives" showBack />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Mes spots prives"
        showBack
        rightAction={
          <TouchableOpacity>
            <Plus size={22} color={colors.primary[600]} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={spots}
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
        renderItem={({ item }) => {
          const s = item as any;
          const spotColor = s.color ?? colors.primary[500];

          return (
            <Card style={styles.spotCard}>
              <TouchableOpacity style={styles.spotRow} activeOpacity={0.7}>
                {/* Color dot */}
                <View style={[styles.colorDot, { backgroundColor: spotColor }]} />

                {/* Info */}
                <View style={styles.spotInfo}>
                  <Text style={styles.spotName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {s.description ? (
                    <Text style={styles.spotDescription} numberOfLines={1}>
                      {s.description}
                    </Text>
                  ) : null}

                  {/* Tags */}
                  {s.tags?.length > 0 && (
                    <View style={styles.tagRow}>
                      {s.tags.slice(0, 3).map((tag: string, i: number) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Visit count */}
                <View style={styles.visitBadge}>
                  <Eye size={14} color={colors.gray[500]} />
                  <Text style={styles.visitCount}>
                    {s._count?.visits ?? s.visitCount ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<MapPinOff size={48} color={colors.gray[300]} />}
            title="Aucun spot prive"
            description="Enregistrez vos spots secrets pour les retrouver facilement."
            action={
              <Button
                title="Ajouter un spot"
                onPress={() => {/* Could open a creation form */}}
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
  spotCard: {
    marginBottom: spacing.sm,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  spotDescription: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: spacing.xxs,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.gray[600],
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  visitCount: {
    ...typography.small,
    color: colors.gray[500],
    fontWeight: '600',
  },
});
