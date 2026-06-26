import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

export interface CategoryOption {
  label: string;
  slug: string | null; // null === "All"
}

interface CategoryStripProps {
  categories: CategoryOption[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryStrip({ categories, selectedSlug, onSelect }: CategoryStripProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {categories.map((cat) => {
        const active = cat.slug === selectedSlug;
        return (
          <Pressable
            key={cat.label || 'all'}
            onPress={() => onSelect(cat.slug)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? colors.brandPrimary : colors.bgSecondary,
                borderColor: active ? colors.brandPrimary : colors.borderDefault,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: FontFamily.medium,
                fontSize: FontSize.sm,
                color: active ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space[4], gap: Space[2], paddingVertical: Space[1] },
  pill: {
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 36,
    paddingHorizontal: Space[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
