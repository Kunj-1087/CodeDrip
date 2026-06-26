import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';

interface StockIndicatorProps {
  stock: number;
  /** Threshold below which we nudge urgency ("Only N left"). */
  lowThreshold?: number;
}

/** Dot + label: green in stock, amber pulsing when low, red when out. */
export function StockIndicator({ stock, lowThreshold = 10 }: StockIndicatorProps) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  const low = stock > 0 && stock <= lowThreshold;

  useEffect(() => {
    if (!low) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [low, pulse]);

  const { color, label } =
    stock <= 0
      ? { color: colors.accentRed, label: 'Out of Stock' }
      : low
        ? { color: colors.accentAmber, label: `Only ${stock} left!` }
        : { color: colors.accentGreen, label: 'In Stock' };

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: low ? pulse : 1 }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
});
