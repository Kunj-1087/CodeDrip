import React from 'react';
import { Text, View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { ColorTokens } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

// Tinted-fill style matching the web: a translucent background with a saturated
// foreground for the same hue.
function tones(colors: ColorTokens): Record<BadgeVariant, { bg: string; fg: string }> {
  return {
    success: { bg: withAlpha(colors.accentGreen, 0.12), fg: colors.accentGreen },
    warning: { bg: withAlpha(colors.accentAmber, 0.12), fg: colors.accentAmber },
    danger: { bg: withAlpha(colors.accentRed, 0.12), fg: colors.accentRed },
    info: { bg: withAlpha(colors.interactiveBlue || '#0066CC', 0.10), fg: colors.interactiveBlue || '#0066CC' },
    neutral: { bg: colors.bgTertiary, fg: colors.textSecondary },
    brand: { bg: colors.brandPrimaryLight, fg: colors.brandPrimary },
  };
}

/** Append an alpha channel to a #RRGGBB hex. */
function withAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.startsWith('#') ? hex.slice(0, 7) : hex;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${cleanHex}${a}`;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { colors } = useTheme();
  const tone = tones(colors)[variant];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, style]}>
      <Text style={[styles.text, { color: tone.fg }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
  },
});

export { withAlpha };
