import React, { useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { formatCurrency } from '../../lib/formatters';
import { resolveAssetUrl } from '../../lib/api';
import type { CartItem as CartItemType } from '../../types';
import { QuantityStepper } from '../ui/QuantityStepper';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

function CartItemComponent({ item, onQuantityChange, onRemove }: CartItemProps) {
  const { colors } = useTheme();
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });
    return (
      <RectButton
        style={[styles.removeAction, { backgroundColor: colors.accentRed }]}
        onPress={() => {
          swipeRef.current?.close();
          onRemove();
        }}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.removeText}>Remove</Text>
        </Animated.View>
      </RectButton>
    );
  };

  const variant = (item as any).variant || (item as any).variantName;

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <View style={[styles.row, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
        <Image
          source={resolveAssetUrl(item.imageUrl)}
          contentFit="cover"
          transition={150}
          style={[styles.thumb, { backgroundColor: colors.bgTertiary }]}
        />
        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>

          {variant ? (
            <Text style={[styles.variant, { color: colors.textMuted }]}>
              {variant}
            </Text>
          ) : null}

          <Text style={[styles.price, { color: colors.brandPrimary }]}>
            {formatCurrency(item.unitPrice)}
          </Text>

          <View style={styles.controls}>
            <QuantityStepper
              value={item.quantity}
              min={1}
              max={item.stockQuantity}
              onChange={onQuantityChange}
              size="sm"
            />
            <Text style={[styles.lineTotal, { color: colors.textSecondary }]}>
              {formatCurrency(item.lineTotal)}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

/**
 * Custom comparison — only re-render when quantity, price, or stock changes.
 * Without memo, every cart item re-renders whenever any quantity changes,
 * causing unnecessary JS thread work on budget devices.
 */
export const CartItem = memo(CartItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.lineTotal === nextProps.item.lineTotal &&
    prevProps.item.unitPrice === nextProps.item.unitPrice &&
    prevProps.item.stockQuantity === nextProps.item.stockQuantity
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: Space[4],
    paddingHorizontal: Space[4],
    borderBottomWidth: 1,
  },
  thumb: { width: 64, height: 64, borderRadius: Radius.md },
  body: { flex: 1, marginLeft: Space[3] },
  name: { fontFamily: FontFamily.semibold, fontSize: FontSize.base },
  variant: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: Space[1] },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.base, marginTop: Space[2] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space[2],
  },
  lineTotal: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  removeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
  },
  removeText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
