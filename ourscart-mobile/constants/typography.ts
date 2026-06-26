// Type scale adapted from the web for mobile density. Font family keys map to the
// exact names @expo-google-fonts registers — see app/_layout.tsx where they load.

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'SpaceMono_400Regular', // spec values like "16GB", "DDR5-5600"
} as const;

export const FontSize = {
  xs: 11, // metadata, labels, badges
  sm: 13, // secondary body, list items
  base: 15, // primary body
  lg: 17, // lead text, card titles
  xl: 19, // section subheadings
  '2xl': 22, // card headings
  '3xl': 26, // page titles
  '4xl': 32, // price display, hero
  '5xl': 40, // large display
} as const;

// React Native expects lineHeight in absolute px, not a unitless multiplier — use the
// `lh()` helper with a font size to convert these ratios.
export const LineHeight = {
  tight: 1.15,
  normal: 1.45,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
} as const;

/** Convert a ratio from LineHeight into the absolute pixel value RN needs. */
export const lh = (fontSize: number, ratio: number = LineHeight.normal): number =>
  Math.round(fontSize * ratio);

export type FontSizeKey = keyof typeof FontSize;
