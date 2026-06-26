import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface StarRatingProps {
  rating: number;
  /** Star glyph size in px. */
  size?: number;
  /** When provided, stars become tappable for input (1–5). */
  onRate?: (value: number) => void;
}

/**
 * Renders 5 stars with half-star precision for display. When `onRate` is set it
 * switches to an interactive selector (full stars only) for review writing.
 */
export function StarRating({ rating, size = 14, onRate }: StarRatingProps) {
  const { colors } = useTheme();
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((index) => {
        const name =
          rating >= index
            ? 'star'
            : rating >= index - 0.5 && !onRate
              ? 'star-half'
              : 'star-outline';
        const star = (
          <Ionicons
            name={name as keyof typeof Ionicons.glyphMap}
            size={size}
            color={colors.accentAmber}
            style={styles.star}
          />
        );
        return onRate ? (
          <Pressable key={index} onPress={() => onRate(index)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          <View key={index}>{star}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 2 },
});
