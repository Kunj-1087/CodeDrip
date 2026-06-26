import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { CartItem } from '../../components/cart/CartItem';
import { OrderSummaryCard } from '../../components/cart/OrderSummaryCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ListRowSkeleton } from '../../components/ui/Skeleton';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { computeTotals } from '../../lib/pricing';
import { FontFamily, FontSize, lh } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { formatCurrency } from '../../lib/formatters';

function withAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.startsWith('#') ? hex.slice(0, 7) : hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${cleanHex}${a}`;
}

export default function CartScreen() {
  const { colors } = useTheme();
  const { cart, loading, coupon, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  useScreenPerformance('CartScreen');

  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState<string | undefined>();
  const [applying, setApplying] = useState(false);

  const totals = computeTotals(cart.subtotal, coupon?.discount ?? 0);

  const applyCode = async () => {
    if (!code.trim()) return;
    setApplying(true);
    setCouponError(undefined);
    try {
      const result = await applyCoupon(code);
      if (result.valid) {
        toast.success(`${result.code} applied`);
        setCode('');
      } else {
        setCouponError('This coupon is not valid for your cart.');
      }
    } catch (e) {
      setCouponError(e instanceof Error ? e.message : 'Invalid coupon code');
    } finally {
      setApplying(false);
    }
  };

  const proceed = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to check out');
      router.push('/(auth)/login');
      return;
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <SafeScreen>
        <Header title="Cart" showBack={false} />
        <View style={{ padding: Space[4] }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </View>
      </SafeScreen>
    );
  }

  if (cart.items.length === 0) {
    return (
      <SafeScreen>
        <Header title="Cart" showBack={false} />
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add planners, templates, or desk tools to start organizing your day.
          </Text>
          <Button
            label="Browse Products"
            variant="primary"
            onPress={() => router.push('/(tabs)/shop')}
            style={styles.browseBtn}
          />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <Header title={`Cart (${cart.itemCount})`} showBack={false} />

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        windowSize={5}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onQuantityChange={(q) => updateQuantity(item.id, q)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={[styles.couponContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.couponLabel, { color: colors.textSecondary }]}>Have a coupon?</Text>

              {coupon ? (
                <View style={[styles.couponChip, { backgroundColor: withAlpha(colors.accentGreen, 0.12) }]}>
                  <Ionicons name="pricetag-outline" size={14} color={colors.accentGreen} />
                  <Text style={[styles.couponChipText, { color: colors.accentGreen }]}>
                    {coupon.code} — {formatCurrency(coupon.discount)} off
                  </Text>
                  <Pressable onPress={removeCoupon} hitSlop={8} style={styles.closeBtn}>
                    <Ionicons name="close" size={14} color={colors.accentGreen} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      placeholder="Enter code (e.g. FOCUS10)"
                      value={code}
                      onChangeText={setCode}
                      autoCapitalize="characters"
                      error={couponError}
                    />
                  </View>
                  <Button
                    label="Apply"
                    variant="secondary"
                    size="sm"
                    onPress={applyCode}
                    loading={applying}
                    style={styles.applyBtn}
                  />
                </View>
              )}
            </View>

            <View style={{ height: Space[4] }} />

            <OrderSummaryCard
              subtotal={totals.subtotal}
              discount={totals.discount}
              shipping={totals.shipping}
              tax={totals.tax}
              total={totals.total}
              footer={<Button label="Proceed to Checkout" onPress={proceed} fullWidth size="lg" />}
            />
          </View>
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Space[10] },
  footer: { padding: Space[4] },
  couponContainer: {
    borderRadius: Radius.lg,
    padding: Space[4],
    borderWidth: 1,
    marginTop: Space[4],
  },
  couponLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, marginBottom: Space[2] },
  couponRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space[2] },
  applyBtn: { marginTop: 25, height: 44 },
  couponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Space[3],
    paddingVertical: Space[1] + 2,
    gap: Space[2],
  },
  couponChipText: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  closeBtn: { justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space[8],
    marginTop: Space[16],
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], marginTop: Space[4], textAlign: 'center' },
  emptySubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, marginTop: Space[2], textAlign: 'center' },
  browseBtn: { marginTop: Space[6], width: 200, alignSelf: 'center' },
});
