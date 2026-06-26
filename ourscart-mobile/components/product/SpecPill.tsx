import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

interface SpecPillProps {
  /** Optional label shown muted before the value, e.g. "Speed". */
  label?: string;
  value: string;
  size?: 'sm' | 'md';
}

/** Monospace spec chip — "16GB", "DDR5-5600" — for cards and detail rows. */
export function SpecPill({ label, value, size = 'sm' }: SpecPillProps) {
  const { colors } = useTheme();
  const fontSize = size === 'sm' ? FontSize.xs : FontSize.sm;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle },
      ]}
    >
      {label ? (
        <Text style={[styles.label, { color: colors.textMuted, fontSize }]}>{label} </Text>
      ) : null}
      <Text style={[styles.value, { color: colors.textPrimary, fontSize }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Space[2],
    paddingVertical: 3,
    marginRight: Space[2],
  },
  label: { fontFamily: FontFamily.medium },
  value: { fontFamily: FontFamily.mono },
});

/** Pick the most card-worthy spec values (capacity/speed first), capped at `count`. */
export function pickSpecs(specs: Record<string, string>, count = 3): string[] {
  const priority = ['capacity', 'speed', 'form_factor', 'interface', 'type'];
  const ordered: string[] = [];
  for (const key of priority) {
    if (specs[key]) ordered.push(specs[key]);
  }
  for (const [key, value] of Object.entries(specs)) {
    if (!priority.includes(key) && value && !ordered.includes(value)) ordered.push(value);
  }
  return ordered.slice(0, count);
}
