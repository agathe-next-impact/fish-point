import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Star,
  MapPin,
  Heart,
  Share2,
  Shield,
  Droplets,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SpotWeather } from '@/components/spots/SpotWeather';
import { SpotSpecies } from '@/components/spots/SpotSpecies';
import { SpotAccessBadge } from '@/components/spots/SpotAccessBadge';
import { useSpot } from '@/hooks';
import {
  formatRating,
  labelForWaterType,
  labelForWaterCategory,
  formatCoordsDecimal,
} from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SpotDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading } = useSpot(slug);

  const spot = data?.data;

  if (isLoading || !spot) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <LoadingSpinner fullScreen message="Chargement du spot..." />
      </SafeAreaView>
    );
  }

  const images: string[] = (spot as any).images ?? [];
  const species: any[] = (spot as any).species ?? [];
  const reviews: any[] = (spot as any).reviews ?? [];
  const regulations: any[] = (spot as any).regulations ?? [];
  const weather = (spot as any).weather;
  const waterQuality = (spot as any).waterQuality;
  const fishabilityScore = (spot as any).fishabilityScore;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Image gallery */}
        <View style={styles.imageGallery}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MapPin size={48} color={colors.gray[300]} />
            </View>
          )}

          {/* Back button overlay */}
          <SafeAreaView style={styles.backOverlay} edges={['top']}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.white} />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share2 size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Score badge */}
          {fishabilityScore != null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreValue}>{Math.round(fishabilityScore)}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name and basic info */}
          <View style={styles.headerSection}>
            <Text style={styles.name}>{spot.name}</Text>

            <View style={styles.badges}>
              {(spot as any).waterType && (
                <Badge
                  label={labelForWaterType((spot as any).waterType)}
                  variant="primary"
                />
              )}
              {(spot as any).waterCategory && (
                <Badge
                  label={labelForWaterCategory((spot as any).waterCategory)}
                  variant="neutral"
                />
              )}
              <SpotAccessBadge accessType={(spot as any).accessType} />
            </View>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Star size={18} color={colors.warning[500]} fill={colors.warning[500]} />
              <Text style={styles.ratingText}>
                {formatRating((spot as any).avgRating ?? null)}
              </Text>
              <Text style={styles.reviewCount}>
                ({reviews.length} avis)
              </Text>
            </View>

            {/* Location */}
            {((spot as any).commune || (spot as any).department) && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={colors.gray[400]} />
                <Text style={styles.locationText}>
                  {[(spot as any).commune, (spot as any).department].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {(spot as any).latitude && (spot as any).longitude && (
              <Text style={styles.coords}>
                {formatCoordsDecimal((spot as any).latitude, (spot as any).longitude)}
              </Text>
            )}
          </View>

          {/* Description */}
          {(spot as any).description && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{(spot as any).description}</Text>
            </Card>
          )}

          {/* Weather */}
          {weather && (
            <SpotWeather
              temperature={weather.temperature}
              humidity={weather.humidity}
              windSpeed={weather.windSpeed}
              pressure={weather.pressure}
              description={weather.description}
            />
          )}

          {/* Water quality */}
          {waterQuality && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Qualite de l'eau</Text>
              <View style={styles.waterQualityRow}>
                <Droplets size={18} color={colors.primary[500]} />
                <Text style={styles.waterQualityText}>
                  {waterQuality.label ?? 'Donnees disponibles'}
                </Text>
              </View>
              {waterQuality.temperature != null && (
                <Text style={styles.waterTemp}>
                  Temperature de l'eau : {Math.round(waterQuality.temperature)} °C
                </Text>
              )}
            </Card>
          )}

          {/* Species */}
          {species.length > 0 && <SpotSpecies species={species} />}

          {/* Regulations */}
          {regulations.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Reglementations</Text>
              {regulations.map((reg: any, i: number) => (
                <View key={i} style={styles.regulationItem}>
                  <Shield size={16} color={colors.warning[600]} />
                  <View style={styles.regulationContent}>
                    <Text style={styles.regulationTitle}>
                      {reg.title ?? reg.type}
                    </Text>
                    {reg.description && (
                      <Text style={styles.regulationDesc}>{reg.description}</Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Reviews */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>
              Avis ({reviews.length})
            </Text>
            {reviews.length > 0 ? (
              reviews.slice(0, 5).map((review: any, i: number) => (
                <View key={review.id ?? i} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>
                      {review.user?.name || 'Anonyme'}
                    </Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={12}
                          color={j < review.rating ? colors.warning[500] : colors.gray[300]}
                          fill={j < review.rating ? colors.warning[500] : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noReviews}>
                Aucun avis pour le moment. Soyez le premier !
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  imageGallery: {
    height: 280,
    backgroundColor: colors.gray[200],
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    position: 'absolute',
    bottom: -20,
    right: SCREEN_PADDING_H,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreValue: {
    ...typography.h2,
    color: colors.white,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.primary[200],
  },
  content: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing['3xl'],
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.h1,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  ratingText: {
    ...typography.bodyBold,
    color: colors.gray[800],
  },
  reviewCount: {
    ...typography.small,
    color: colors.gray[400],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  locationText: {
    ...typography.body,
    color: colors.gray[600],
  },
  coords: {
    ...typography.caption,
    color: colors.gray[400],
    marginTop: spacing.xxs,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.gray[700],
    lineHeight: 22,
  },
  waterQualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  waterQualityText: {
    ...typography.bodyMedium,
    color: colors.gray[700],
  },
  waterTemp: {
    ...typography.small,
    color: colors.gray[600],
  },
  regulationItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  regulationContent: {
    flex: 1,
  },
  regulationTitle: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  regulationDesc: {
    ...typography.small,
    color: colors.gray[600],
    marginTop: spacing.xxs,
  },
  reviewItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewUser: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    ...typography.body,
    color: colors.gray[600],
  },
  noReviews: {
    ...typography.body,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
});
