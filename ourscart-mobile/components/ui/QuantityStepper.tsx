import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  disabled = false,
}: QuantityStepperProps) {
  const { colors } = useTheme();
  const dim = size === 'sm' ? 30 : 38;

  const atMin = value <= min;
  const atMax = value >= max;

  const step = (delta: number) => {
    const next = value + delta;
    if (next < min || next > max) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  const renderButton = (icon: 'remove' | 'add', delta: number, blocked: boolean) => (
    <Pressable
      onPress={() => step(delta)}
      disabled={blocked || disabled}
      hitSlop={4}
      accessibilityRole="button"
      style={[
        styles.btn,
        { width: dim, height: dim, opacity: blocked || disabled ? 0.4 : 1 },
      ]}
    >
      <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={colors.textPrimary} />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.borderDefault, backgroundColor: colors.bgPrimary },
      ]}
    >
      {renderButton('remove', -1, atMin)}
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      {renderButton('add', 1, atMax)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  btn: { alignItems: 'center', justifyContent: 'center' },
  value: {
    width: 40,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
  },
});
