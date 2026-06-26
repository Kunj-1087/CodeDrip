import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  ActivityIndicator,
  Text,
  StyleSheet,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<
  ButtonSize,
  { height: number; fontSize: number; paddingH: number }
> = {
  sm: { height: 36, fontSize: FontSize.sm, paddingH: Space[5] },
  md: { height: 44, fontSize: FontSize.base, paddingH: Space[6] },
  lg: { height: 52, fontSize: FontSize.lg, paddingH: Space[8] },
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const pressIn = () => {
    if (isDisabled) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const pressOut = () => {
    if (isDisabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const palette: Record<
    ButtonVariant,
    { bg: string; fg: string; border: string; borderWidth: number }
  > = {
    primary: {
      bg: colors.brandPrimary,
      fg: '#FFFFFF',
      border: colors.brandPrimary,
      borderWidth: 0,
    },
    secondary: {
      bg: colors.bgSecondary,
      fg: colors.textPrimary,
      border: colors.borderDefault,
      borderWidth: 1,
    },
    ghost: {
      bg: colors.transparent,
      fg: colors.textSecondary,
      border: colors.transparent,
      borderWidth: 0,
    },
    danger: {
      bg: colors.accentRed,
      fg: '#FFFFFF',
      border: colors.accentRed,
      borderWidth: 0,
    },
  };

  const { bg, fg, border, borderWidth } = palette[variant];
  const sizing = SIZE_MAP[size];

  // We keep a fixed minWidth based on the size to avoid layout shift when loading
  const minWidth = size === 'sm' ? 80 : size === 'md' ? 120 : 160;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale }] },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.base,
          variant === 'primary' && Shadows.sm,
          {
            backgroundColor: bg,
            borderColor: border,
            borderWidth: borderWidth,
            height: sizing.height,
            paddingHorizontal: sizing.paddingH,
            minWidth: fullWidth ? undefined : minWidth,
            opacity: isDisabled ? 0.45 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <View style={styles.content}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: fg,
                  fontFamily: FontFamily.semibold,
                  fontSize: sizing.fontSize,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Space[2],
  },
  label: {
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
