import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { ProductVariant } from '../../types';

interface VariantSelectorProps {
  label?: string;
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

/** Flex-wrap option buttons; out-of-stock options get a diagonal SVG strikethrough. */
export function VariantSelector({
  label = 'Variant',
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  const { colors } = useTheme();
  if (variants.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.options}>
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const soldOut = variant.stockQuantity <= 0;
          return (
            <Pressable
              key={variant.id}
              onPress={() => !soldOut && onSelect(variant)}
              disabled={soldOut}
              style={[
                styles.option,
                {
                  borderColor: selected ? colors.brandPrimary : colors.borderDefault,
                  borderWidth: selected ? 2 : 1,
                  backgroundColor: selected ? colors.brandPrimaryLight : colors.bgPrimary,
                  opacity: soldOut ? 0.4 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: selected ? FontFamily.semibold : FontFamily.regular,
                  fontSize: FontSize.sm,
                  color: selected ? colors.brandPrimary : colors.textSecondary,
                }}
              >
                {variant.name}
              </Text>
              {soldOut ? (
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                  <Line
                    x1="6%"
                    y1="86%"
                    x2="94%"
                    y2="14%"
                    stroke={colors.textMuted}
                    strokeWidth={1.5}
                  />
                </Svg>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: Space[2] },
  label: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, marginBottom: Space[2] },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  option: {
    minWidth: 56,
    paddingHorizontal: Space[4],
    paddingVertical: Space[2],
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
