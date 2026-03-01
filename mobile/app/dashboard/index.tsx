import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCatchesBySpecies, useCatchesByHour, useProgression, useCatchStats } from '@/hooks';
import { formatWeight, pluralize } from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SCREEN_PADDING_H * 2 - spacing.lg * 2;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const { data: speciesData, isLoading: speciesLoading } = useCatchesBySpecies();
  const { data: hourData, isLoading: hourLoading } = useCatchesByHour();
  const { data: progressionData, isLoading: progressionLoading } = useProgression();
  const { data: statsData, isLoading: statsLoading } = useCatchStats();

  const isLoading = speciesLoading || hourLoading || progressionLoading || statsLoading;

  const speciesItems = speciesData?.data ?? [];
  const hourItems = hourData?.data ?? [];
  const progressionItems = progressionData?.data ?? [];
  const stats = statsData?.data;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Dashboard" showBack />
        <LoadingSpinner fullScreen message="Chargement des statistiques..." />
      </SafeAreaView>
    );
  }

  const totalCatches = stats?.totalCatches ?? speciesItems.reduce((sum, s) => sum + s.count, 0);
  const totalWeight = (stats as any)?.totalWeight ?? 0;
  const uniqueSpecies = stats?.totalSpecies ?? speciesItems.length;

  const hasData = totalCatches > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Dashboard" showBack />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 size={48} color={colors.gray[300]} />}
          title="Pas encore de donnees"
          description="Enregistrez des captures pour voir vos statistiques apparaitre ici."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary stats */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{totalCatches}</Text>
              <Text style={styles.statLabel}>
                {pluralize(totalCatches, 'Capture')}
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{uniqueSpecies}</Text>
              <Text style={styles.statLabel}>
                {pluralize(uniqueSpecies, 'Espece')}
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatWeight(totalWeight)}
              </Text>
              <Text style={styles.statLabel}>Poids total</Text>
            </Card>
          </View>

          {/* Catches by species (simplified chart: horizontal bars) */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <PieChart size={20} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Par espece</Text>
            </View>

            {speciesItems.slice(0, 8).map((item) => {
              const maxCount = Math.max(...speciesItems.map((s) => s.count));
              const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <View key={item.speciesId} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {item.speciesName}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${width}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{item.count}</Text>
                </View>
              );
            })}
          </Card>

          {/* Catches by hour */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Par heure</Text>
            </View>

            <View style={styles.hourChart}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const item = hourItems.find((h) => h.hour === hour);
                const count = item?.count ?? 0;
                const maxHourCount = Math.max(...hourItems.map((h) => h.count), 1);
                const height = Math.max((count / maxHourCount) * 80, 2);

                return (
                  <View key={hour} style={styles.hourBarWrapper}>
                    <View
                      style={[
                        styles.hourBar,
                        {
                          height,
                          backgroundColor:
                            count > 0 ? colors.primary[500] : colors.gray[200],
                        },
                      ]}
                    />
                    {hour % 4 === 0 && (
                      <Text style={styles.hourLabel}>{hour}h</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Progression */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Progression</Text>
            </View>

            {progressionItems.length > 0 ? (
              progressionItems.slice(-6).map((item) => (
                <View key={item.month} style={styles.progressRow}>
                  <Text style={styles.progressMonth}>{item.month}</Text>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${
                            (item.count /
                              Math.max(
                                ...progressionItems.map((p) => p.count),
                                1,
                              )) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressCount}>
                    {item.count} ({formatWeight(item.totalWeight)})
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>Pas de donnees de progression.</Text>
            )}
          </Card>
        </ScrollView>
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
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary[700],
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  barLabel: {
    ...typography.small,
    color: colors.gray[700],
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 6,
  },
  barCount: {
    ...typography.bodyMedium,
    color: colors.gray[800],
    width: 30,
    textAlign: 'right',
  },
  hourChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  hourBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourBar: {
    width: '100%',
    borderRadius: 2,
  },
  hourLabel: {
    ...typography.caption,
    color: colors.gray[400],
    marginTop: spacing.xxs,
    fontSize: 9,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  progressMonth: {
    ...typography.small,
    color: colors.gray[600],
    width: 60,
  },
  progressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.gray[100],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 5,
  },
  progressCount: {
    ...typography.caption,
    color: colors.gray[500],
    width: 80,
    textAlign: 'right',
  },
  noData: {
    ...typography.body,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
});
