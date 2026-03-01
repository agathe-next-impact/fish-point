import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { SpotCard } from '@/components/spots/SpotCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSpots } from '@/hooks';
import { labelForWaterType, labelForFishingType } from '@/utils/format';
import type { WaterType, FishingType } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

const WATER_TYPES: WaterType[] = ['RIVER', 'LAKE', 'POND', 'SEA', 'CANAL', 'STREAM'];
const FISHING_TYPES: FishingType[] = ['SPINNING', 'FLY', 'COARSE', 'CARP', 'SURFCASTING', 'BOAT'];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [selectedWaterType, setSelectedWaterType] = useState<WaterType | null>(null);
  const [selectedFishingType, setSelectedFishingType] = useState<FishingType | null>(null);

  const filters = {
    ...(search ? { search } : {}),
    ...(selectedWaterType ? { waterType: [selectedWaterType] } : {}),
    ...(selectedFishingType ? { fishingTypes: [selectedFishingType] } : {}),
  };

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useSpots(Object.keys(filters).length > 0 ? filters : undefined);

  const spots = data?.data ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearFilters = () => {
    setSelectedWaterType(null);
    setSelectedFishingType(null);
    setSearch('');
  };

  const hasFilters = !!selectedWaterType || !!selectedFishingType || !!search;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un spot..."
            placeholderTextColor={colors.gray[400]}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips: water type */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={WATER_TYPES}
          contentContainerStyle={styles.chipList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = selectedWaterType === item;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() =>
                  setSelectedWaterType(isActive ? null : item)
                }
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {labelForWaterType(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Filter chips: fishing type */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FISHING_TYPES}
          contentContainerStyle={styles.chipList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = selectedFishingType === item;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() =>
                  setSelectedFishingType(isActive ? null : item)
                }
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {labelForFishingType(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {hasFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearText}>Effacer les filtres</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Spot list */}
      {isLoading ? (
        <LoadingSpinner fullScreen message="Chargement des spots..." />
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id ?? item.slug}
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
            <SpotCard
              slug={item.slug}
              name={item.name}
              imageUrl={(item as any).imageUrl ?? null}
              waterType={(item as any).waterType}
              rating={(item as any).avgRating ?? null}
              reviewCount={(item as any)._count?.reviews ?? 0}
              fishabilityScore={(item as any).fishabilityScore ?? null}
              commune={(item as any).commune ?? null}
              department={(item as any).department ?? null}
              distance={(item as any).distance ?? null}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<SearchIcon size={48} color={colors.gray[300]} />}
              title="Aucun spot trouve"
              description="Essayez de modifier vos filtres ou d'elargir votre recherche."
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
  header: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.gray[900],
  },
  searchContainer: {
    paddingHorizontal: SCREEN_PADDING_H,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.gray[900],
    padding: 0,
  },
  filtersSection: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  chipList: {
    paddingHorizontal: SCREEN_PADDING_H,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  chipText: {
    ...typography.buttonSmall,
    color: colors.gray[600],
  },
  chipTextActive: {
    color: colors.primary[700],
  },
  clearButton: {
    paddingHorizontal: SCREEN_PADDING_H,
  },
  clearText: {
    ...typography.small,
    color: colors.primary[600],
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingBottom: spacing['3xl'],
  },
});
