import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary[600] },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.primary[50] },
    text: { color: colors.primary[700] },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary[600],
    },
    text: { color: colors.primary[600] },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary[600] },
  },
  danger: {
    container: { backgroundColor: colors.error[600] },
    text: { color: colors.white },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    text: { ...typography.buttonSmall },
  },
  md: {
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    text: { ...typography.button },
  },
  lg: {
    container: { paddingVertical: spacing.lg, paddingHorizontal: spacing['2xl'] },
    text: { ...typography.button, fontSize: 17 },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        v.container,
        s.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={v.text.color as string}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[s.text, v.text, icon ? { marginLeft: spacing.sm } : undefined]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Base styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  disabled: {
    opacity: 0.5,
  },
});
