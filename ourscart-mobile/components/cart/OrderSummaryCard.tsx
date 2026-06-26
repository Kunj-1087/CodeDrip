import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { formatCurrency } from '../../lib/formatters';

export interface OrderSummaryCardProps {
  subtotal: number;
  discount?: number;
  shipping: number;
  tax: number;
  total: number;
  /** Optional CTA / note rendered under the total (e.g. checkout button). */
  footer?: React.ReactNode;
  title?: string;
}

export function OrderSummaryCard({
  subtotal,
  discount = 0,
  shipping,
  tax,
  total,
  footer,
  title = 'Order Summary',
}: OrderSummaryCardProps) {
  const { colors } = useTheme();

  const Line = ({
    label,
    value,
    accent,
  }: {
    label: string;
    value: string;
    accent?: string;
  }) => (
    <View style={styles.line}>
      <Text
        style={{
          fontFamily: FontFamily.regular,
          fontSize: FontSize.sm,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: FontFamily.medium,
          fontSize: FontSize.sm,
          color: accent ?? colors.textPrimary,
        }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.card,
        Shadows.sm,
        { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle },
      ]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      <Line label="Subtotal" value={formatCurrency(subtotal)} />
      {discount > 0 ? (
        <Line label="Discount" value={`- ${formatCurrency(discount)}`} accent={colors.accentGreen} />
      ) : null}
      <Line
        label="Shipping"
        value={shipping > 0 ? formatCurrency(shipping) : 'Free'}
        accent={shipping > 0 ? undefined : colors.accentGreen}
      />
      <Line label="Tax (18% GST)" value={formatCurrency(tax)} />

      {/* Total row with top border */}
      <View style={[styles.totalRow, { borderTopColor: colors.borderSubtle }]}>
        <Text
          style={{
            fontFamily: FontFamily.bold,
            fontSize: FontSize.lg,
            color: colors.textPrimary,
          }}
        >
          Total
        </Text>
        <Text
          style={{
            fontFamily: FontFamily.bold,
            fontSize: FontSize.lg,
            color: colors.textPrimary,
          }}
        >
          {formatCurrency(total)}
        </Text>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Space[5],
  },
  title: { fontFamily: FontFamily.semibold, fontSize: FontSize.lg, marginBottom: Space[3] },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space[2],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Space[3],
    paddingTop: Space[3],
  },
  footer: { marginTop: Space[5] },
});
