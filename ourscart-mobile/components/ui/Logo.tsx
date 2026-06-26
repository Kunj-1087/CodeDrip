import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily } from '../../constants/typography';
import { Space } from '../../constants/spacing';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'wordmark-only';
  color?: string;
}

const ICON_SIZE: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

/** Focus/crosshair mark for FocusKit brand. */
function Mark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer focus ring */}
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crosshair lines */}
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center dot */}
      <Circle cx={12} cy={12} r={2} fill={color} />
      {/* Desk/surface line at bottom */}
      <Path
        d="M5 20h14"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Logo({ size = 'md', variant = 'full', color }: LogoProps) {
  const { colors } = useTheme();
  const iconSize = ICON_SIZE[size];
  const markColor = color ?? colors.brandPrimary;
  const wordSize = iconSize * 0.72;

  return (
    <View style={styles.row}>
      {variant !== 'wordmark-only' ? <Mark size={iconSize} color={markColor} /> : null}
      {variant !== 'icon-only' ? (
        <Text
          style={[
            styles.wordmark,
            {
              color: color ?? colors.textPrimary,
              fontSize: wordSize,
              marginLeft: variant === 'full' ? Space[2] : 0,
            },
          ]}
        >
          FocusKit
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontFamily: FontFamily.bold, letterSpacing: -0.5 },
});
