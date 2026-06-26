import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ListRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { fulfillmentVariant } from '../orders/index';
import { apiGet, apiPatch } from '../../lib/api';
import { formatCurrency, formatDateTime, titleCaseStatus } from '../../lib/formatters';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { AdminOrderRow, FulfillmentStatus } from '../../types';

const FILTERS: (FulfillmentStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const NEXT_STATUSES: FulfillmentStatus[] = ['processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminOrderRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: '1', limit: '50' });
      if (filter !== 'all') qs.set('fulfillmentStatus', filter);
      const r = await apiGet<{ orders: AdminOrderRow[] }>(`/admin/orders?${qs.toString()}`);
      setOrders(r.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (status: FulfillmentStatus) => {
    if (!selected) return;
    const id = selected.id;
    setSelected(null);
    try {
      await apiPatch(`/admin/orders/${id}`, { fulfillmentStatus: status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, fulfillmentStatus: status } : o)));
      toast.success(`Marked ${titleCaseStatus(status)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <SafeScreen>
      <Header title="Orders" />

      <View style={[styles.filterBar, { borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.brandPrimary : colors.bgSecondary, borderColor: active ? colors.brandPrimary : colors.borderSubtle },
                ]}
              >
                <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: active ? colors.white : colors.textSecondary }}>
                  {f === 'all' ? 'All' : titleCaseStatus(f)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Space[4] }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelected(item)} style={[styles.row, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>{item.orderNumber}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.customerName ?? item.customerEmail ?? 'Customer'} · {formatDateTime(item.createdAt)}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.total, { color: colors.textPrimary }]}>{formatCurrency(item.total)}</Text>
                <Badge label={titleCaseStatus(item.fulfillmentStatus)} variant={fulfillmentVariant(item.fulfillmentStatus)} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders" subtitle="Nothing matches this filter." />}
        />
      )}

      <Modal visible={!!selected} onClose={() => setSelected(null)} position="bottom" title={`Update ${selected?.orderNumber ?? ''}`}>
        <View style={{ gap: Space[1] }}>
          {NEXT_STATUSES.map((status) => (
            <Pressable key={status} style={styles.statusOption} onPress={() => updateStatus(status)}>
              <Text style={[styles.statusText, { color: status === 'cancelled' ? colors.accentRed : colors.textPrimary }]}>
                Mark as {titleCaseStatus(status)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  filterBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: Space[3] },
  filters: { paddingHorizontal: Space[4], gap: Space[2] },
  chip: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Space[3], paddingVertical: 7 },
  list: { paddingHorizontal: Space[4], paddingBottom: Space[10] },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[4], borderBottomWidth: StyleSheet.hairlineWidth },
  orderNumber: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  total: { fontFamily: FontFamily.bold, fontSize: FontSize.sm },
  statusOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Space[4] },
  statusText: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
});
