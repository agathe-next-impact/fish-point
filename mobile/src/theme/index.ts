/**
 * Fish Point design system — barrel export
 *
 * Usage:
 *   import { colors, lightTheme, darkTheme, typography, spacing } from '@/theme';
 */

export { colors, lightTheme, darkTheme } from './colors';
export type { Theme } from './colors';

export { typography, fontSizes, fontWeights, lineHeights } from './typography';
export type { TypographyVariant } from './typography';

export {
  spacing,
  borderRadius,
  SCREEN_PADDING_H,
  SCREEN_PADDING_V,
} from './spacing';
export type { SpacingKey, BorderRadiusKey } from './spacing';
