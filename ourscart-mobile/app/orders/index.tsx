import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListRowSkeleton } from '../../components/ui/Skeleton';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatDate, pluralize, titleCaseStatus } from '../../lib/formatters';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { OrderSummary, FulfillmentStatus } from '../../types';

export function fulfillmentVariant(status: FulfillmentStatus): BadgeVariant {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'shipped':
      return 'info';
    case 'processing':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useScreenPerformance('OrdersScreen');

  const load = useCallback(async () => {
    try {
      const { orders: list } = await apiGet<{ orders: OrderSummary[] }>('/orders');
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
    else setLoading(false);
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (orders.length > 0) {
      const hasDelivered = orders.some((o) => o.fulfillmentStatus === 'delivered');
      if (hasDelivered) {
        void (async () => {
          try {
            if (await StoreReview.isAvailableAsync()) {
              await StoreReview.requestReview();
            }
          } catch (err) {
            console.error('StoreReview error:', err);
          }
        })();
      }
    }
  }, [orders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!isAuthenticated) {
    return (
      <SafeScreen>
        <Header title="My Orders" />
        <EmptyState
          icon="receipt-outline"
          title="Sign in to view orders"
          actionLabel="Sign In"
          onAction={() => router.push('/(auth)/login')}
        />
      </SafeScreen>
    );
  }

  if (loading) {
    return (
      <SafeScreen>
        <Header title="My Orders" />
        <View style={{ padding: Space[4] }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </View>
      </SafeScreen>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeScreen>
        <Header title="My Orders" />
        <EmptyState
          icon="receipt-outline"
          title="No orders yet"
          subtitle="When you place an order, it'll show up here."
          actionLabel="Start Shopping"
          onAction={() => router.push('/(tabs)/shop')}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header title="My Orders" />
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.2}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/orders/${item.id}`)}
            style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>{item.orderNumber}</Text>
              <Badge label={titleCaseStatus(item.fulfillmentStatus)} variant={fulfillmentVariant(item.fulfillmentStatus)} />
            </View>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {formatDate(item.createdAt)} · {pluralize(item.itemCount, 'item')}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.total, { color: colors.textPrimary }]}>{formatCurrency(item.total)}</Text>
              <View style={styles.detailsLink}>
                <Text style={[styles.detailsText, { color: colors.brandPrimary }]}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Space[4], gap: Space[3] },
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Space[4] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontFamily: FontFamily.bold, fontSize: FontSize.base },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, marginTop: Space[1] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space[3] },
  total: { fontFamily: FontFamily.bold, fontSize: FontSize.lg },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
});
