/**
 * Fish Point spacing scale
 *
 * A consistent 4-point based spacing system.
 * Values are in density-independent pixels (dp / pt).
 */

export const spacing = {
  /** 2 dp — hairline gaps, icon padding */
  xxs: 2,

  /** 4 dp — tight inner padding */
  xs: 4,

  /** 8 dp — compact spacing between related elements */
  sm: 8,

  /** 12 dp — default inner padding in small components */
  md: 12,

  /** 16 dp — standard screen horizontal padding, card padding */
  lg: 16,

  /** 24 dp — spacing between card groups, section gaps */
  xl: 24,

  /** 32 dp — large section separators */
  '2xl': 32,

  /** 48 dp — major layout gaps */
  '3xl': 48,

  /** 64 dp — hero / splash spacing */
  '4xl': 64,
} as const;

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

/** Standard horizontal padding used on most screens. */
export const SCREEN_PADDING_H = spacing.lg;

/** Standard vertical padding between the safe-area edge and content. */
export const SCREEN_PADDING_V = spacing.lg;

/** Border radius tokens */
export const borderRadius = {
  /** 4 dp — subtle rounding (chips, badges) */
  xs: 4,

  /** 8 dp — buttons, inputs */
  sm: 8,

  /** 12 dp — cards */
  md: 12,

  /** 16 dp — modals, bottom sheets */
  lg: 16,

  /** 24 dp — large rounded containers */
  xl: 24,

  /** Fully round (pill buttons, avatars) */
  full: 9999,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
