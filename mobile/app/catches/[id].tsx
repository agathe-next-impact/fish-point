import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Share2,
  Fish,
  MapPin,
  Calendar,
  Thermometer,
  Cloud,
  Wind,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCatch } from '@/hooks';
import { formatWeight, formatLength, formatDate, formatTemperature } from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useCatch(id);

  const catchData = data?.data;

  const handleShare = async () => {
    if (!catchData) return;
    try {
      await Share.share({
        message: `J'ai capture un(e) ${(catchData as any).species || 'poisson'} ${
          catchData.weight ? `de ${formatWeight(catchData.weight)}` : ''
        } sur Fish Point !`,
      });
    } catch {
      // Share cancelled
    }
  };

  if (isLoading || !catchData) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  const c = catchData as any;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Photo */}
        <View style={styles.photoSection}>
          {c.photoUrl ? (
            <Image
              source={{ uri: c.photoUrl }}
              style={styles.photo}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Fish size={56} color={colors.gray[300]} />
            </View>
          )}

          {/* Overlay controls */}
          <SafeAreaView style={styles.overlay} edges={['top']}>
            <TouchableOpacity style={styles.overlayButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayButton} onPress={handleShare}>
              <Share2 size={20} color={colors.white} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Species name */}
          <Text style={styles.species}>
            {c.species || 'Espece inconnue'}
          </Text>

          {/* Measurements */}
          <View style={styles.measurements}>
            {c.weight != null && (
              <Badge label={formatWeight(c.weight)} variant="primary" />
            )}
            {c.length != null && (
              <Badge label={formatLength(c.length)} variant="primary" />
            )}
            {c.technique && (
              <Badge label={c.technique} variant="neutral" />
            )}
          </View>

          {/* Spot */}
          {c.spot?.name && (
            <TouchableOpacity
              style={styles.spotRow}
              onPress={() => {
                if (c.spot?.slug) router.push(`/spots/${c.spot.slug}`);
              }}
            >
              <MapPin size={16} color={colors.primary[600]} />
              <Text style={styles.spotName}>{c.spot.name}</Text>
            </TouchableOpacity>
          )}

          {/* Date */}
          <View style={styles.dateRow}>
            <Calendar size={16} color={colors.gray[400]} />
            <Text style={styles.dateText}>{formatDate(c.createdAt)}</Text>
          </View>

          {/* Details */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            <DetailRow label="Appat / Leurre" value={c.bait} />
            <DetailRow label="Technique" value={c.technique} />
            <DetailRow label="Type de leurre" value={c.lureType} />
            <DetailRow label="Couleur du leurre" value={c.lureColor} />
            <DetailRow label="Montage" value={c.rigType} />

            {c.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{c.notes}</Text>
              </View>
            )}
          </Card>

          {/* Weather conditions */}
          {(c.weatherTemp != null || c.windSpeed != null || c.cloudCover != null) && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Conditions meteo</Text>
              <View style={styles.weatherGrid}>
                {c.weatherTemp != null && (
                  <View style={styles.weatherItem}>
                    <Thermometer size={18} color={colors.error[500]} />
                    <Text style={styles.weatherValue}>
                      {formatTemperature(c.weatherTemp)}
                    </Text>
                  </View>
                )}
                {c.windSpeed != null && (
                  <View style={styles.weatherItem}>
                    <Wind size={18} color={colors.gray[500]} />
                    <Text style={styles.weatherValue}>
                      {Math.round(c.windSpeed)} km/h
                    </Text>
                  </View>
                )}
                {c.cloudCover != null && (
                  <View style={styles.weatherItem}>
                    <Cloud size={18} color={colors.gray[500]} />
                    <Text style={styles.weatherValue}>
                      {c.cloudCover}%
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Detail row helper
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  photoSection: {
    height: 300,
    backgroundColor: colors.gray[200],
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.sm,
  },
  overlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SCREEN_PADDING_H,
    paddingBottom: spacing['3xl'],
  },
  species: {
    ...typography.h1,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  measurements: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  spotName: {
    ...typography.bodyMedium,
    color: colors.primary[600],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dateText: {
    ...typography.body,
    color: colors.gray[500],
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailLabel: {
    ...typography.small,
    color: colors.gray[500],
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  notesSection: {
    marginTop: spacing.md,
  },
  notesLabel: {
    ...typography.small,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.body,
    color: colors.gray[700],
    lineHeight: 22,
  },
  weatherGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weatherValue: {
    ...typography.bodyMedium,
    color: colors.gray[700],
  },
});
