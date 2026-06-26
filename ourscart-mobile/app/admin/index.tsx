import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { TextSkeleton } from '../../components/ui/Skeleton';
import { fulfillmentVariant } from '../orders/index';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatAmount, formatDate, titleCaseStatus } from '../../lib/formatters';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { AdminKpis, RevenuePoint, AdminOrderRow } from '../../types';

interface KpiCard {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: 'brand' | 'green' | 'amber' | 'blue';
}

export default function AdminDashboard() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [series, setSeries] = useState<RevenuePoint[]>([]);
  const [recent, setRecent] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [k, s, r] = await Promise.all([
        apiGet<AdminKpis>('/admin/analytics/kpis'),
        apiGet<{ series: RevenuePoint[] }>('/admin/analytics/revenue-series?days=7'),
        apiGet<{ orders: AdminOrderRow[] }>('/admin/analytics/recent-orders'),
      ]);
      setKpis(k);
      setSeries(s.series);
      setRecent(r.orders.slice(0, 5));
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tintColor: Record<KpiCard['tint'], string> = {
    brand: colors.brandPrimary,
    green: colors.accentGreen,
    amber: colors.accentAmber,
    blue: colors.interactiveBlue,
  };

  const cards: KpiCard[] = kpis
    ? [
        { icon: 'cash-outline', label: 'Revenue (MTD)', value: formatCurrency(kpis.revenueMtd), tint: 'green' },
        { icon: 'receipt-outline', label: 'Orders Today', value: String(kpis.ordersToday), tint: 'brand' },
        { icon: 'people-outline', label: 'Customers', value: String(kpis.totalCustomers), tint: 'blue' },
        { icon: 'warning-outline', label: 'Low Stock', value: String(kpis.lowStock), tint: 'amber' },
      ]
    : [];

  const chartConfig = {
    backgroundGradientFrom: colors.bgSecondary,
    backgroundGradientTo: colors.bgSecondary,
    decimalPlaces: 0,
    color: () => colors.brandPrimary,
    labelColor: () => colors.textMuted,
    barPercentage: 0.6,
    propsForBackgroundLines: { stroke: colors.borderSubtle },
  };

  const navItems = [
    { icon: 'cube-outline' as const, label: 'Products', href: '/admin/products' as const },
    { icon: 'receipt-outline' as const, label: 'Orders', href: '/admin/orders' as const },
    { icon: 'settings-outline' as const, label: 'Settings', href: '/admin/settings' as const },
  ];

  return (
    <SafeScreen>
      <Header title="Admin Dashboard" onBack={() => router.replace('/(tabs)/profile')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <TextSkeleton lines={8} />
        ) : (
          <>
            {/* KPI grid */}
            <View style={styles.kpiGrid}>
              {cards.map((c) => (
                <View key={c.label} style={[styles.kpiCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
                  <View style={[styles.kpiIcon, { backgroundColor: colors.bgPrimary }]}>
                    <Ionicons name={c.icon} size={20} color={tintColor[c.tint]} />
                  </View>
                  <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{c.value}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{c.label}</Text>
                </View>
              ))}
            </View>

            {/* Revenue chart */}
            {series.length > 0 ? (
              <View style={[styles.chartCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Revenue · last 7 days</Text>
                <BarChart
                  data={{
                    labels: series.map((p) => formatDate(p.date).split(' ').slice(0, 2).join(' ')),
                    datasets: [{ data: series.map((p) => Math.round(p.revenue)) }],
                  }}
                  width={width - Space[4] * 2 - Space[4] * 2}
                  height={200}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  fromZero
                  showValuesOnTopOfBars={false}
                  chartConfig={chartConfig}
                  style={{ marginLeft: -Space[2], borderRadius: Radius.md }}
                />
              </View>
            ) : null}

            {/* Quick nav */}
            <View style={styles.nav}>
              {navItems.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.href)}
                  style={[styles.navItem, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
                >
                  <Ionicons name={item.icon} size={22} color={colors.brandPrimary} />
                  <Text style={[styles.navLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>

            {/* Recent orders */}
            <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: Space[2] }]}>Recent Orders</Text>
            {recent.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/orders/${o.id}`)}
                style={[styles.recentRow, { borderBottomColor: colors.borderSubtle }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentNumber, { color: colors.textPrimary }]}>{o.orderNumber}</Text>
                  <Text style={[styles.recentMeta, { color: colors.textMuted }]}>
                    {o.customerName ?? o.customerEmail ?? 'Customer'} · {formatCurrency(o.total)}
                  </Text>
                </View>
                <Badge label={titleCaseStatus(o.fulfillmentStatus)} variant={fulfillmentVariant(o.fulfillmentStatus)} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Space[4], paddingBottom: Space[10] },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] },
  kpiCard: {
    width: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Space[4],
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Space[2] },
  kpiValue: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'] },
  kpiLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, marginTop: 2 },
  chartCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, padding: Space[4], marginTop: Space[4] },
  cardTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.base, marginBottom: Space[3] },
  nav: { marginTop: Space[4], gap: Space[2] },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Space[4],
  },
  navLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base },
  recentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Space[4], borderBottomWidth: StyleSheet.hairlineWidth },
  recentNumber: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  recentMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
});
