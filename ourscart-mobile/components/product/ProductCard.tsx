import React, { useRef, useEffect, memo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize, lh } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { formatCurrency, discountPercent } from '../../lib/formatters';
import { resolveAssetUrl } from '../../lib/api';
import type { Product } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SpecPill, pickSpecs } from './SpecPill';

export interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  onWishlistToggle: () => void;
  isWishlisted?: boolean;
  /** Fixed width for horizontal carousels; omit to flex inside a grid column. */
  width?: number;
}

const BLUR = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

function ProductCardComponent({
  product,
  onPress,
  onAddToCart,
  onWishlistToggle,
  isWishlisted = false,
  width,
}: ProductCardProps) {
  const { colors, isDark } = useTheme();
  const specs = pickSpecs(product.specs, 2); // 2 spec pills on card
  const off = discountPercent(product.basePrice, product.compareAtPrice);

  const outOfStock = !product.inStock || product.stockQuantity <= 0;
  const lowStock = product.inStock && product.stockQuantity > 0 && product.stockQuantity <= 10;

  // Spring animations for card press
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  // Low Stock pulsing dot
  const pulseDot = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (lowStock) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseDot, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseDot, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [lowStock, pulseDot]);

  const rating = product.avgRating || 0;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        width ? { width } : styles.flex,
        {
          transform: [{ scale }],
          opacity: outOfStock ? 0.65 : 1,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.card,
          Shadows.sm,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        {/* Image Area */}
        <View style={[styles.imageWrap, { backgroundColor: colors.bgTertiary }]}>
          <Image
            source={resolveAssetUrl(product.imageUrl)}
            placeholder={BLUR}
            contentFit="cover"
            transition={200}
            style={styles.image}
          />

          {/* Sale Badge */}
          {off ? (
            <Badge label="SALE" variant="danger" style={styles.saleBadge} />
          ) : null}

          {/* Wishlist Button */}
          <Pressable
            onPress={onWishlistToggle}
            hitSlop={8}
            style={[
              styles.heart,
              {
                backgroundColor: isDark ? 'rgba(28,27,25,0.85)' : 'rgba(255,255,255,0.90)',
              },
            ]}
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={isWishlisted ? colors.accentRed : colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Info Section padding: sp3 (12) */}
        <View style={styles.body}>
          {/* Brand */}
          <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>
            {product.brand}
          </Text>

          {/* Name */}
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Spec pills row */}
          {specs.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.specs}
              contentContainerStyle={styles.specsContent}
            >
              {specs.map((val, i) => (
                <View
                  key={`${val}-${i}`}
                  style={[
                    styles.specPill,
                    {
                      backgroundColor: colors.bgTertiary,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>
                    {val}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline'}
                size={12}
                color={rating >= star - 0.5 ? colors.brandPrimary : colors.borderDefault}
                style={styles.starIcon}
              />
            ))}
            <Text style={[styles.ratingCountText, { color: colors.textMuted }]}>
              ({product.reviewCount || 0})
            </Text>
          </View>

          {/* Price & Stock Row */}
          <View style={styles.priceContainer}>
            {lowStock ? (
              <View style={styles.lowStockRow}>
                <Animated.View style={[styles.pulseDot, { backgroundColor: colors.accentAmber, opacity: pulseDot }]} />
                <Text style={[styles.lowStockText, { color: colors.accentAmber }]}>Low Stock</Text>
              </View>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.brandPrimary }]}>
                {formatCurrency(product.basePrice)}
              </Text>
              {off ? (
                <Text style={[styles.compareAt, { color: colors.textMuted }]}>
                  {formatCurrency(product.compareAtPrice as number)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Add to Cart / Notify Me */}
          {outOfStock ? (
            <Button
              label="Notify Me"
              size="sm"
              variant="ghost"
              fullWidth
              onPress={() => {
                onAddToCart();
              }}
              style={{ marginTop: Space[2] }}
            />
          ) : (
            <Button
              label="Add to Cart"
              size="sm"
              variant="primary"
              fullWidth
              onPress={onAddToCart}
              style={{ marginTop: Space[2] }}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Custom comparison — only re-render when meaningful product data changes.
 * This prevents FlatList from re-rendering every card on every scroll event
 * (which is the default behavior without memo).
 */
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.basePrice === nextProps.product.basePrice &&
    prevProps.product.stockQuantity === nextProps.product.stockQuantity &&
    prevProps.isWishlisted === nextProps.isWishlisted
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  imageWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  image: { width: '100%', height: '100%' },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  body: { padding: Space[3] },
  brand: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Space[1],
  },
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm),
    minHeight: lh(FontSize.sm) * 2,
    marginBottom: Space[2],
  },
  specs: { marginBottom: Space[2] },
  specsContent: { alignItems: 'center', gap: Space[1] },
  specPill: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: Space[1],
  },
  specText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space[2],
  },
  starIcon: {
    marginRight: 1,
  },
  ratingCountText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    marginLeft: Space[1],
  },
  priceContainer: {
    marginBottom: Space[2],
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space[1],
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  lowStockText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.lg },
  compareAt: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    textDecorationLine: 'line-through',
    marginLeft: Space[2],
  },
});
