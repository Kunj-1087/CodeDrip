import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrderSummaryCard } from '../../components/cart/OrderSummaryCard';
import { fulfillmentVariant } from './index';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime, titleCaseStatus } from '../../lib/formatters';
import { FontFamily, FontSize, lh } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { OrderDetail, FulfillmentStatus, PaymentStatus } from '../../types';

const STAGES = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

// Map the API's fulfillment enum onto our 5-stage visual timeline.
function stageIndex(status: FulfillmentStatus): number {
  switch (status) {
    case 'processing':
      return 1;
    case 'shipped':
      return 2;
    case 'delivered':
      return 4;
    default:
      return 0; // pending
  }
}

function paymentVariant(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'failed':
      return 'danger' as const;
    case 'refunded':
      return 'info' as const;
    default:
      return 'warning' as const;
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const toast = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const { order: o } = await apiGet<{ order: OrderDetail }>(`/orders/${id}`);
      setOrder(o);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const needHelp = async () => {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      toast.info('Reach us at hello@focuskit.in');
      return;
    }
    await MailComposer.composeAsync({
      recipients: ['hello@focuskit.in'],
      subject: `Help with order ${order?.order_number ?? ''}`,
    });
  };

  if (loading) {
    return (
      <SafeScreen>
        <Header title="Order" />
        <View style={{ padding: Space[4] }}>
          <TextSkeleton lines={6} />
        </View>
      </SafeScreen>
    );
  }

  if (error || !order) {
    return (
      <SafeScreen>
        <Header title="Order" />
        <EmptyState icon="alert-circle-outline" title="Couldn't load this order" actionLabel="Retry" onAction={load} />
      </SafeScreen>
    );
  }

  const cancelled = order.fulfillment_status === 'cancelled';
  const current = stageIndex(order.fulfillment_status);

  return (
    <SafeScreen>
      <Header title={order.order_number} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status summary */}
        <View style={styles.statusRow}>
          <Text style={[styles.placedAt, { color: colors.textSecondary }]}>
            Placed {formatDateTime(order.created_at)}
          </Text>
          <Badge
            label={titleCaseStatus(order.fulfillment_status)}
            variant={fulfillmentVariant(order.fulfillment_status)}
          />
        </View>

        {/* Timeline */}
        {cancelled ? (
          <View style={[styles.cancelledBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
            <Ionicons name="close-circle" size={20} color={colors.accentRed} />
            <Text style={[styles.cancelledText, { color: colors.textPrimary }]}>This order was cancelled.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {STAGES.map((stage, i) => {
              const done = i < current;
              const active = i === current;
              const last = i === STAGES.length - 1;
              return (
                <View key={stage} style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    {!last && (
                      <View style={[styles.connector, { backgroundColor: done ? colors.accentGreen : colors.borderSubtle }]} />
                    )}
                    {active ? (
                      <View style={styles.activeContainer}>
                        <Animated.View
                          style={[
                            styles.pulseRing,
                            {
                              borderColor: colors.brandPrimary,
                              opacity: pulse,
                              transform: [
                                {
                                  scale: pulse.interpolate({
                                    inputRange: [0.4, 1],
                                    outputRange: [1.4, 0.8],
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                        <View style={[styles.dotInner, { backgroundColor: colors.brandPrimary }]} />
                      </View>
                    ) : done ? (
                      <View style={[styles.dotDone, { backgroundColor: colors.accentGreen }]}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={[styles.dotPending, { borderColor: colors.borderDefault, backgroundColor: colors.bgPrimary }]} />
                    )}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text
                      style={[
                        styles.stageLabel,
                        {
                          color: done || active ? colors.textPrimary : colors.textMuted,
                          fontFamily: active ? FontFamily.semibold : FontFamily.regular,
                        },
                      ]}
                    >
                      {stage}
                    </Text>
                    {active && (
                      <Text style={[styles.stageSub, { color: colors.textSecondary }]}>
                        Current Status
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Items */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
        <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
          {order.items.map((item) => (
            <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.itemBody}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.snapshot.name}
                </Text>
                {item.snapshot.variant ? (
                  <Text style={[styles.itemVariant, { color: colors.textMuted }]}>{item.snapshot.variant}</Text>
                ) : null}
                <Text style={[styles.itemQty, { color: colors.textMuted }]}>Qty {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Shipping address */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>
        <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, padding: Space[4] }]}>
          <Text style={[styles.addrName, { color: colors.textPrimary }]}>{order.shipping_address.fullName}</Text>
          <Text style={[styles.addrLine, { color: colors.textSecondary }]}>
            {[
              order.shipping_address.line1,
              order.shipping_address.line2,
              order.shipping_address.city,
              order.shipping_address.state,
              order.shipping_address.postalCode,
              order.shipping_address.country,
            ]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {order.shipping_address.phone ? (
            <Text style={[styles.addrLine, { color: colors.textSecondary }]}>📞 {order.shipping_address.phone}</Text>
          ) : null}
        </View>

        {/* Payment summary */}
        <View style={styles.paymentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Payment</Text>
          <Badge label={titleCaseStatus(order.payment_status)} variant={paymentVariant(order.payment_status)} />
        </View>
        <OrderSummaryCard
          title="Summary"
          subtotal={order.subtotal}
          discount={order.discount_amount}
          shipping={order.shipping_fee}
          tax={order.tax_amount}
          total={order.total}
        />

        <Button label="Need Help?" variant="secondary" onPress={needHelp} fullWidth style={{ marginTop: Space[5] }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Space[4], paddingBottom: Space[10] },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space[5] },
  placedAt: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  timeline: { marginVertical: Space[4], paddingHorizontal: Space[2] },
  timelineRow: { flexDirection: 'row', minHeight: 64 },
  timelineMarker: { width: 32, alignItems: 'center', justifyContent: 'flex-start' },
  activeContainer: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  pulseRing: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  dotDone: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  dotPending: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginTop: 2 },
  connector: { width: 2, position: 'absolute', top: 22, bottom: -10, left: 15, zIndex: -1 },
  timelineBody: { flex: 1, marginLeft: Space[3], justifyContent: 'flex-start' },
  stageLabel: { fontSize: FontSize.base, lineHeight: lh(FontSize.base) },
  stageSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Space[4],
    marginBottom: Space[5],
  },
  cancelledText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, marginBottom: Space[3], marginTop: Space[4] },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, paddingHorizontal: Space[4] },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Space[3], borderBottomWidth: StyleSheet.hairlineWidth },
  itemBody: { flex: 1, marginRight: Space[3] },
  itemName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  itemVariant: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  itemQty: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  itemPrice: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  addrName: { fontFamily: FontFamily.semibold, fontSize: FontSize.base, marginBottom: Space[1] },
  addrLine: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, marginTop: 2 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space[4], marginBottom: Space[3] },
});
