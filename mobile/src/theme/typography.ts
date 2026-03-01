import { TextStyle } from 'react-native';

/**
 * Fish Point typography scale
 *
 * Uses system fonts (San Francisco on iOS, Roboto on Android).
 * Each entry is a complete React Native TextStyle so it can be spread directly:
 *
 *   <Text style={typography.h1}>Title</Text>
 */

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
} as const;

export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// ---------------------------------------------------------------------------
// Named text styles
// ---------------------------------------------------------------------------

export const typography = {
  /** Screen titles, hero text */
  h1: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
    letterSpacing: -0.5,
  } satisfies TextStyle,

  /** Section headers */
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes.xl * lineHeights.tight,
    letterSpacing: -0.3,
  } satisfies TextStyle,

  /** Card titles, subsection headers */
  h3: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
    letterSpacing: -0.2,
  } satisfies TextStyle,

  /** Prominent inline headings */
  h4: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.md * lineHeights.normal,
  } satisfies TextStyle,

  /** Default body text */
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
  } satisfies TextStyle,

  /** Slightly emphasised body text */
  bodyMedium: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.base * lineHeights.normal,
  } satisfies TextStyle,

  /** Bold body text */
  bodyBold: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes.base * lineHeights.normal,
  } satisfies TextStyle,

  /** Secondary / helper text */
  small: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  } satisfies TextStyle,

  /** Captions, timestamps, metadata */
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: 0.2,
  } satisfies TextStyle,

  /** Overline / label text (e.g. form labels, chip text) */
  overline: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  /** Button text */
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.tight,
    letterSpacing: 0.3,
  } satisfies TextStyle,

  /** Small button / tab text */
  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.sm * lineHeights.tight,
    letterSpacing: 0.3,
  } satisfies TextStyle,

  /** Large display numbers (e.g. stats, counts) */
  display: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: -0.8,
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
