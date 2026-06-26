import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize, lh, LineHeight, LetterSpacing } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Button } from '../ui/Button';

interface HeroBannerProps {
  onShopPress: () => void;
}

/** Subtle dot-grid decoration anchored to the banner's bottom-right. */
function DotGridDecor({ color }: { color: string }) {
  return (
    <Svg width={140} height={120} viewBox="0 0 140 120" style={styles.decor} opacity={0.04}>
      <Circle cx={20} cy={20} r={3} fill={color} />
      <Circle cx={50} cy={20} r={3} fill={color} />
      <Circle cx={80} cy={20} r={3} fill={color} />
      <Circle cx={110} cy={20} r={3} fill={color} />
      <Circle cx={20} cy={50} r={3} fill={color} />
      <Circle cx={50} cy={50} r={3} fill={color} />
      <Circle cx={80} cy={50} r={3} fill={color} />
      <Circle cx={110} cy={50} r={3} fill={color} />
      <Circle cx={20} cy={80} r={3} fill={color} />
      <Circle cx={50} cy={80} r={3} fill={color} />
      <Circle cx={80} cy={80} r={3} fill={color} />
      <Circle cx={110} cy={80} r={3} fill={color} />
    </Svg>
  );
}

export function HeroBanner({ onShopPress }: HeroBannerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle },
      ]}
    >
      <DotGridDecor color={colors.textPrimary} />
      <Text style={[styles.headline, { color: colors.textPrimary }]}>
        Organize your study, work, money, and desk.
      </Text>
      <Text style={[styles.subtext, { color: colors.textSecondary }]}>
        Digital planners, Notion templates, printable stationery, journals, and desk tools for focused days.
      </Text>
      <View style={styles.cta}>
        <Button label="Shop Student Tools" onPress={onShopPress} size="md" variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Space[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Space[6],
    overflow: 'hidden',
  },
  decor: { position: 'absolute', right: 0, bottom: 0 },
  headline: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    lineHeight: lh(FontSize['3xl'], LineHeight.tight),
    letterSpacing: LetterSpacing.tight,
    maxWidth: '92%',
  },
  subtext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm, LineHeight.relaxed),
    marginTop: Space[2],
    maxWidth: '90%',
  },
  cta: { marginTop: Space[5], alignSelf: 'flex-start' },
});
