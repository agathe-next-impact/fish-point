import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Locate, SlidersHorizontal, MapPin } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { useMapStore } from '@/stores/map.store';
import { useLocation } from '@/hooks';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MapScreen() {
  const { location, requestPermission } = useLocation();
  const { viewport, filters } = useMapStore();
  const [showFilters, setShowFilters] = useState(false);

  const handleLocate = async () => {
    const granted = await requestPermission();
    if (granted && location) {
      useMapStore.getState().setViewport({
        latitude: location.latitude,
        longitude: location.longitude,
        zoom: 13,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map placeholder - Mapbox will be integrated here */}
      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color={colors.primary[300]} />
        <Text style={styles.mapPlaceholderText}>Carte</Text>
        <Text style={styles.mapPlaceholderHint}>
          Integration Mapbox a venir
        </Text>
        <Text style={styles.mapCoords}>
          {viewport.latitude.toFixed(4)}, {viewport.longitude.toFixed(4)} (zoom {viewport.zoom})
        </Text>
      </View>

      {/* Floating controls */}
      <SafeAreaView style={styles.controls} edges={['top']}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Rechercher un spot...</Text>
        </View>
      </SafeAreaView>

      {/* Bottom floating buttons */}
      <View style={styles.bottomControls}>
        {/* Filter button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={20} color={colors.gray[700]} />
          <Text style={styles.floatingButtonText}>Filtres</Text>
        </TouchableOpacity>

        {/* Locate button */}
        <TouchableOpacity
          style={[styles.floatingButton, styles.locateButton]}
          onPress={handleLocate}
          activeOpacity={0.8}
        >
          <Locate size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Filter panel (simple version) */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <SafeAreaView edges={['bottom']}>
            <Text style={styles.filterTitle}>Filtres</Text>

            <View style={styles.filterChips}>
              {['RIVER', 'LAKE', 'POND', 'SEA', 'CANAL'].map((type) => {
                const isActive = filters.waterTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                    ]}
                    onPress={() => {
                      const current = filters.waterTypes;
                      useMapStore.getState().updateFilters({
                        waterTypes: isActive
                          ? current.filter((t) => t !== type)
                          : [...current, type],
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {WATER_TYPE_MAP[type] || type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => useMapStore.getState().resetFilters()}
            >
              <Text style={styles.resetText}>Reinitialiser</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WATER_TYPE_MAP: Record<string, string> = {
  RIVER: 'Riviere',
  LAKE: 'Lac',
  POND: 'Etang',
  SEA: 'Mer',
  CANAL: 'Canal',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  mapPlaceholderText: {
    ...typography.h1,
    color: colors.primary[300],
    marginTop: spacing.md,
  },
  mapPlaceholderHint: {
    ...typography.small,
    color: colors.primary[200],
    marginTop: spacing.xs,
  },
  mapCoords: {
    ...typography.caption,
    color: colors.primary[300],
    marginTop: spacing.sm,
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.sm,
  },
  searchBar: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchText: {
    ...typography.body,
    color: colors.gray[400],
  },
  bottomControls: {
    position: 'absolute',
    bottom: 120,
    right: SCREEN_PADDING_H,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: spacing.xs,
  },
  locateButton: {
    paddingHorizontal: spacing.sm + 2,
  },
  floatingButtonText: {
    ...typography.buttonSmall,
    color: colors.gray[700],
  },
  filterPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: SCREEN_PADDING_H,
    paddingTop: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  filterTitle: {
    ...typography.h3,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingVertical: spacing.sm,
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
  resetButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  resetText: {
    ...typography.bodyMedium,
    color: colors.gray[500],
  },
});
