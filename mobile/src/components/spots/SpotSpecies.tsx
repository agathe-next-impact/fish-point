import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fish } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { labelForAbundance } from '@/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeciesItem {
  id?: string;
  name: string;
  abundance?: string | null;
  commonName?: string | null;
}

interface SpotSpeciesProps {
  species: SpeciesItem[];
}

// ---------------------------------------------------------------------------
// Abundance to badge variant
// ---------------------------------------------------------------------------

function abundanceVariant(
  abundance?: string | null,
): 'success' | 'warning' | 'error' | 'neutral' {
  switch (abundance) {
    case 'VERY_HIGH':
    case 'HIGH':
      return 'success';
    case 'MODERATE':
      return 'warning';
    case 'LOW':
    case 'RARE':
      return 'error';
    default:
      return 'neutral';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotSpecies({ species }: SpotSpeciesProps) {
  if (!species.length) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Especes presentes</Text>

      {species.map((s, index) => (
        <View key={s.id ?? index} style={styles.speciesRow}>
          <Fish size={18} color={colors.primary[500]} />
          <View style={styles.speciesInfo}>
            <Text style={styles.speciesName}>
              {s.commonName || s.name}
            </Text>
            {s.commonName && s.name !== s.commonName ? (
              <Text style={styles.scientificName}>{s.name}</Text>
            ) : null}
          </View>
          {s.abundance && (
            <Badge
              label={labelForAbundance(s.abundance)}
              variant={abundanceVariant(s.abundance)}
            />
          )}
        </View>
      ))}
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
  speciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.sm,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    ...typography.bodyMedium,
    color: colors.gray[800],
  },
  scientificName: {
    ...typography.caption,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
});
