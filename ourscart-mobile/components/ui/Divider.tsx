import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize, LetterSpacing } from '../../constants/typography';
import { Space } from '../../constants/spacing';

interface DividerProps {
  /** Optional centered label, e.g. "or". */
  label?: string;
  spacing?: number;
}

export function Divider({ label, spacing = Space[4] }: DividerProps) {
  const { colors } = useTheme();

  if (!label) {
    return (
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.borderSubtle,
          marginVertical: spacing,
        }}
      />
    );
  }

  return (
    <View style={[styles.row, { marginVertical: spacing }]}>
      <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    letterSpacing: LetterSpacing.wider,
    marginHorizontal: Space[3],
  },
});
