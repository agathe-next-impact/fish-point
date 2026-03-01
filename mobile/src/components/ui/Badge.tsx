import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Variant colors
// ---------------------------------------------------------------------------

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colors.primary[100], text: colors.primary[700] },
  success: { bg: colors.success[100], text: colors.success[700] },
  warning: { bg: colors.warning[100], text: colors.warning[800] },
  error: { bg: colors.error[100], text: colors.error[700] },
  neutral: { bg: colors.gray[100], text: colors.gray[700] },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const vc = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: vc.bg }, style]}>
      <Text style={[styles.text, { color: vc.text }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
