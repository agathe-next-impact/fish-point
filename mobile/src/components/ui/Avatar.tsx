import React from 'react';
import { View, Text, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '@/theme';
import { initials } from '@/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: AvatarSize;
  style?: ImageStyle | ViewStyle;
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Avatar({ name, uri, size = 'md', style }: AvatarProps) {
  const dim = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: colors.gray[200],
          },
          style as ImageStyle,
        ]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: fontSizeMap[size] }]}>
        {initials(name || '?')}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.bodyBold,
    color: colors.primary[700],
  },
});
