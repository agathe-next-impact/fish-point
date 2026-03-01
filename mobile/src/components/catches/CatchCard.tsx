import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Fish, MapPin, Calendar } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';
import { formatWeight, formatLength, formatDate } from '@/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CatchCardProps {
  id: string;
  species?: string | null;
  weight?: number | null;
  length?: number | null;
  photoUrl?: string | null;
  spotName?: string | null;
  createdAt: string;
  technique?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatchCard({
  id,
  species,
  weight,
  length,
  photoUrl,
  spotName,
  createdAt,
  technique,
}: CatchCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => router.push(`/catches/${id}`)}
    >
      {/* Photo */}
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Fish size={32} color={colors.gray[300]} />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.species} numberOfLines={1}>
          {species || 'Espece inconnue'}
        </Text>

        {/* Measurements */}
        <View style={styles.measurements}>
          {weight != null && (
            <Text style={styles.measure}>{formatWeight(weight)}</Text>
          )}
          {weight != null && length != null && (
            <Text style={styles.measureSep}> / </Text>
          )}
          {length != null && (
            <Text style={styles.measure}>{formatLength(length)}</Text>
          )}
        </View>

        {/* Spot */}
        {spotName && (
          <View style={styles.row}>
            <MapPin size={12} color={colors.gray[400]} />
            <Text style={styles.meta} numberOfLines={1}>{spotName}</Text>
          </View>
        )}

        {/* Date + technique */}
        <View style={styles.row}>
          <Calendar size={12} color={colors.gray[400]} />
          <Text style={styles.meta}>
            {formatDate(createdAt)}
            {technique ? ` - ${technique}` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  photo: {
    width: 100,
    height: 100,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  species: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.xxs,
  },
  measurements: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  measure: {
    ...typography.bodyMedium,
    color: colors.primary[700],
  },
  measureSep: {
    ...typography.body,
    color: colors.gray[400],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  meta: {
    ...typography.caption,
    color: colors.gray[500],
  },
});
