import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star, MapPin } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';
import { Badge } from '@/components/ui/Badge';
import { formatRating, formatDistance, labelForWaterType } from '@/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpotCardProps {
  slug: string;
  name: string;
  imageUrl?: string | null;
  waterType?: string;
  rating?: number | null;
  reviewCount?: number;
  distance?: number | null;
  fishabilityScore?: number | null;
  commune?: string | null;
  department?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotCard({
  slug,
  name,
  imageUrl,
  waterType,
  rating,
  reviewCount = 0,
  distance,
  fishabilityScore,
  commune,
  department,
}: SpotCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => router.push(`/spots/${slug}`)}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MapPin size={28} color={colors.gray[300]} />
          </View>
        )}

        {/* Score badge */}
        {fishabilityScore != null && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(fishabilityScore)}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {waterType ? (
            <Badge label={labelForWaterType(waterType)} variant="primary" />
          ) : null}
        </View>

        {/* Location */}
        {(commune || department) && (
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.gray[400]} />
            <Text style={styles.location} numberOfLines={1}>
              {[commune, department].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Rating + distance */}
        <View style={styles.bottomRow}>
          <View style={styles.ratingRow}>
            <Star size={14} color={colors.warning[500]} fill={colors.warning[500]} />
            <Text style={styles.rating}>{formatRating(rating ?? null)}</Text>
            <Text style={styles.reviewCount}>({reviewCount})</Text>
          </View>

          {distance != null && (
            <Text style={styles.distance}>{formatDistance(distance)}</Text>
          )}
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
  imageWrapper: {
    height: 140,
    backgroundColor: colors.gray[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  scoreBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scoreText: {
    ...typography.buttonSmall,
    color: colors.white,
  },
  content: {
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  name: {
    ...typography.h4,
    color: colors.gray[900],
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  location: {
    ...typography.small,
    color: colors.gray[500],
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  rating: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  reviewCount: {
    ...typography.small,
    color: colors.gray[400],
  },
  distance: {
    ...typography.small,
    color: colors.primary[600],
    fontWeight: '600',
  },
});
