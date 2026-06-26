import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize, LetterSpacing } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { formatCurrency } from '../../lib/formatters';
import { resolveAssetUrl } from '../../lib/api';
import type { Product } from '../../types';
import { SpecPill, pickSpecs } from './SpecPill';

interface ProductCardHorizontalProps {
  product: Product;
  onPress: () => void;
  /** Optional trailing action (e.g. a remove or add icon button). */
  trailing?: React.ReactNode;
}

/** Compact list-row variant used in search results and dense lists. */
const ProductCardHorizontal = React.memo(function ProductCardHorizontal({
  product,
  onPress,
  trailing,
}: ProductCardHorizontalProps) {
  const { colors } = useTheme();
  const specs = pickSpecs(product.specs, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.borderSubtle, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Image
        source={resolveAssetUrl(product.imageUrl)}
        contentFit="cover"
        transition={150}
        style={[styles.thumb, { backgroundColor: colors.bgTertiary }]}
      />
      <View style={styles.body}>
        <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.metaRow}>
          {specs.map((value, i) => (
            <SpecPill key={`${value}-${i}`} value={value} />
          ))}
        </View>
      </View>
      <View style={styles.tail}>
        <Text style={[styles.price, { color: colors.brandPrimary }]}>
          {formatCurrency(product.basePrice)}
        </Text>
        {trailing ?? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
});

export { ProductCardHorizontal };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  body: { flex: 1, marginHorizontal: Space[3] },
  brand: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  name: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, marginTop: 1 },
  metaRow: { flexDirection: 'row', marginTop: Space[1] },
  tail: { alignItems: 'flex-end', gap: Space[1] },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.base },
});
