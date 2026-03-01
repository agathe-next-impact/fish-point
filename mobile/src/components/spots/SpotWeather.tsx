import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, Thermometer, Wind, Droplets } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { formatTemperature, formatPressure } from '@/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpotWeatherProps {
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  pressure?: number | null;
  description?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotWeather({
  temperature,
  humidity,
  windSpeed,
  pressure,
  description,
}: SpotWeatherProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Meteo actuelle</Text>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      <View style={styles.grid}>
        {temperature != null && (
          <View style={styles.item}>
            <Thermometer size={20} color={colors.error[500]} />
            <Text style={styles.value}>{formatTemperature(temperature)}</Text>
            <Text style={styles.label}>Temperature</Text>
          </View>
        )}

        {humidity != null && (
          <View style={styles.item}>
            <Droplets size={20} color={colors.primary[500]} />
            <Text style={styles.value}>{humidity}%</Text>
            <Text style={styles.label}>Humidite</Text>
          </View>
        )}

        {windSpeed != null && (
          <View style={styles.item}>
            <Wind size={20} color={colors.gray[500]} />
            <Text style={styles.value}>{Math.round(windSpeed)} km/h</Text>
            <Text style={styles.label}>Vent</Text>
          </View>
        )}

        {pressure != null && (
          <View style={styles.item}>
            <Cloud size={20} color={colors.gray[600]} />
            <Text style={styles.value}>{formatPressure(pressure)}</Text>
            <Text style={styles.label}>Pression</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  value: {
    ...typography.bodyBold,
    color: colors.gray[800],
  },
  label: {
    ...typography.caption,
    color: colors.gray[500],
  },
});
