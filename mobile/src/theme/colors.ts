/**
 * Fish Point color palette
 *
 * Sky/ocean blue primary theme designed for an outdoor fishing application.
 * All palettes follow a 50-900 shade scale for flexible usage.
 */

// ---------------------------------------------------------------------------
// Base palettes
// ---------------------------------------------------------------------------

export const colors = {
  // Primary — sky blue, anchored at 700 = #0369a1
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic — success (green)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Semantic — warning (amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Semantic — error (red)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Water tones — used for water-type indicators (river, lake, sea, pond…)
  water: {
    fresh: '#38bdf8', // rivers & lakes — lighter sky blue
    salt: '#0369a1', // ocean & sea  — deeper blue
    brackish: '#0e7490', // estuaries    — teal-blue
    pond: '#67e8f9', // ponds & still water — cyan
    stream: '#7dd3fc', // streams — light blue
  },

  // Absolute values (theme-independent)
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ---------------------------------------------------------------------------
// Themed tokens
// ---------------------------------------------------------------------------

export const lightTheme = {
  // Backgrounds
  background: colors.white,
  backgroundSecondary: colors.gray[50],
  backgroundTertiary: colors.gray[100],

  // Surfaces (cards, modals, sheets)
  surface: colors.white,
  surfaceSecondary: colors.gray[50],
  surfaceElevated: colors.white,

  // Borders & dividers
  border: colors.gray[200],
  borderFocused: colors.primary[500],
  divider: colors.gray[100],

  // Text
  text: colors.gray[900],
  textSecondary: colors.gray[600],
  textTertiary: colors.gray[400],
  textInverse: colors.white,
  textLink: colors.primary[600],

  // Primary action
  primary: colors.primary[600],
  primaryLight: colors.primary[100],
  primaryDark: colors.primary[800],
  onPrimary: colors.white,

  // Semantic
  success: colors.success[600],
  successLight: colors.success[100],
  warning: colors.warning[500],
  warningLight: colors.warning[100],
  error: colors.error[600],
  errorLight: colors.error[100],

  // Map / water overlay
  waterOverlay: 'rgba(3, 105, 161, 0.12)',

  // Skeleton / placeholder shimmer
  skeleton: colors.gray[200],
  skeletonHighlight: colors.gray[100],

  // Status bar style
  statusBar: 'dark' as const,
} as const;

export const darkTheme = {
  // Backgrounds
  background: colors.gray[900],
  backgroundSecondary: colors.gray[800],
  backgroundTertiary: colors.gray[700],

  // Surfaces
  surface: colors.gray[800],
  surfaceSecondary: colors.gray[700],
  surfaceElevated: '#1e293b', // slate-800 equivalent

  // Borders & dividers
  border: colors.gray[700],
  borderFocused: colors.primary[400],
  divider: colors.gray[700],

  // Text
  text: colors.gray[50],
  textSecondary: colors.gray[400],
  textTertiary: colors.gray[500],
  textInverse: colors.gray[900],
  textLink: colors.primary[400],

  // Primary action
  primary: colors.primary[400],
  primaryLight: 'rgba(14, 165, 233, 0.15)',
  primaryDark: colors.primary[600],
  onPrimary: colors.gray[900],

  // Semantic
  success: colors.success[400],
  successLight: 'rgba(34, 197, 94, 0.15)',
  warning: colors.warning[400],
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: colors.error[400],
  errorLight: 'rgba(239, 68, 68, 0.15)',

  // Map / water overlay
  waterOverlay: 'rgba(56, 189, 248, 0.18)',

  // Skeleton / placeholder shimmer
  skeleton: colors.gray[700],
  skeletonHighlight: colors.gray[600],

  // Status bar style
  statusBar: 'light' as const,
} as const;

// ---------------------------------------------------------------------------
// Theme type (useful for typed hooks / context)
// ---------------------------------------------------------------------------

export type Theme = typeof lightTheme;
