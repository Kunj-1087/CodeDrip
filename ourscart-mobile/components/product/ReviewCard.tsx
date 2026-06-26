import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize, lh, LineHeight } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { formatDate } from '../../lib/formatters';
import type { Review } from '../../types';
import { StarRating } from '../ui/StarRating';
import { Badge } from '../ui/Badge';

export function ReviewCard({ review }: { review: Review }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.author, { color: colors.textPrimary }]}>{review.author}</Text>
          {review.isVerifiedPurchase ? <Badge label="Verified" variant="success" /> : null}
        </View>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>

      <View style={styles.ratingRow}>
        <StarRating rating={review.rating} size={14} />
      </View>

      {review.title ? (
        <Text style={[styles.title, { color: colors.textPrimary }]}>{review.title}</Text>
      ) : null}
      {review.body ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>{review.body}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Space[2] },
  author: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  ratingRow: { marginTop: Space[2] },
  title: { fontFamily: FontFamily.semibold, fontSize: FontSize.base, marginTop: Space[2] },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm, LineHeight.relaxed),
    marginTop: Space[1],
  },
});
