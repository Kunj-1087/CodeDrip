// Color tokens for FocusKit student productivity marketplace. Light, warm, modern
// indigo-based palette. Every component reads colors through useTheme().

export const LightColors = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FAF7F2',
  bgTertiary: '#F3F0EA',

  // Borders
  borderSubtle: '#E5E7EB',
  borderDefault: '#D1D5DB',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Brand (FocusKit indigo)
  brandPrimary: '#4F46E5',
  brandPrimaryHover: '#4338CA',
  brandPrimaryLight: '#EEF2FF',

  // Status
  accentGreen: '#A7C957',
  accentRed: '#E5534B',
  accentAmber: '#F59E0B',
  interactiveBlue: '#4F46E5',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const DarkColors = {
  bgPrimary: '#1C1B19',
  bgSecondary: '#242320',
  bgTertiary: '#2C2B28',

  borderSubtle: '#38372F',
  borderDefault: '#46443B',

  textPrimary: '#ECEAE3',
  textSecondary: '#9B9792',
  textMuted: '#6B6862',

  brandPrimary: '#6366F1',
  brandPrimaryHover: '#4F46E5',
  brandPrimaryLight: '#1E1B4B',

  accentGreen: '#A7C957',
  accentRed: '#EF6B63',
  accentAmber: '#FBBF24',
  interactiveBlue: '#6366F1',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorTokens = { readonly [K in keyof typeof LightColors]: string };
