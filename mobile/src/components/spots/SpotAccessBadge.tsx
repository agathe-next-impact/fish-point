import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';
import { ACCESS_TYPE_LABELS } from '@fish-point/shared';

const ACCESS_COLORS: Record<string, { bg: string; text: string }> = {
  FREE: { bg: '#dcfce7', text: '#166534' },
  FISHING_CARD: { bg: '#dbeafe', text: '#1e40af' },
  AAPPMA_SPECIFIC: { bg: '#e0e7ff', text: '#3730a3' },
  PAID: { bg: '#fef3c7', text: '#92400e' },
  MEMBERS_ONLY: { bg: '#f3e8ff', text: '#6b21a8' },
  RESTRICTED: { bg: '#ffedd5', text: '#9a3412' },
  PRIVATE: { bg: '#fee2e2', text: '#991b1b' },
};

interface SpotAccessBadgeProps {
  accessType: string | null | undefined;
  style?: ViewStyle;
}

export function SpotAccessBadge({ accessType, style }: SpotAccessBadgeProps) {
  if (!accessType) return null;

  const label = ACCESS_TYPE_LABELS[accessType as keyof typeof ACCESS_TYPE_LABELS] || accessType;
  const ac = ACCESS_COLORS[accessType] || { bg: colors.gray[100], text: colors.gray[700] };

  return (
    <View style={[styles.badge, { backgroundColor: ac.bg }, style]}>
      <Text style={[styles.text, { color: ac.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xxs + 1,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
