import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SafeScreen } from '../components/layout/SafeScreen';
import { ProductCardHorizontal } from '../components/product/ProductCardHorizontal';
import { ListRowSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { useScreenPerformance } from '../hooks/useScreenPerformance';
import { apiGet } from '../lib/api';
import { sanitizeSearchQuery } from '../utils/sanitize';
import { FontFamily, FontSize } from '../constants/typography';
import { Radius } from '../constants/radius';
import { Space } from '../constants/spacing';
import type { Product, ProductListResponse } from '../types';

const RECENT_KEY = 'focuskit_recent_searches';
const MAX_RECENT = 8;

export default function SearchScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  useScreenPerformance('SearchScreen');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useAsyncStorage<string[]>(RECENT_KEY, []);

  const [focused, setFocused] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  const animate = (to: number) => {
    Animated.timing(glow, { toValue: to, duration: 150, useNativeDriver: false }).start();
  };

  const borderColor = focused ? colors.brandPrimary : colors.borderSubtle;
  const backgroundColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgSecondary, colors.brandPrimaryLight],
  });

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    let active = true;
    setLoading(true);
    apiGet<ProductListResponse>(`/products?q=${encodeURIComponent(term)}&limit=20`)
      .then((r) => {
        if (active) {
          setResults(r.products);
          setSearched(true);
        }
      })
      .catch(() => active && setResults([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [debounced]);

  const remember = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecent((prev) => [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, MAX_RECENT));
    },
    [setRecent],
  );

  const openProduct = (product: Product) => {
    remember(query || product.name);
    router.push(`/product/${product.slug}`);
  };

  return (
    <SafeScreen edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <Animated.View style={[styles.field, { backgroundColor, borderColor }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={(t) => setQuery(sanitizeSearchQuery(t))}
            placeholder="Search planners, templates, notebooks, desk tools..."
            placeholderTextColor={colors.textMuted}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => { setFocused(true); animate(1); }}
            onBlur={() => { setFocused(false); animate(0); }}
            style={[styles.input, { color: colors.textPrimary }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </Animated.View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.cancel, { color: colors.brandPrimary }]}>Cancel</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Space[4] }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </View>
      ) : searched && results.length === 0 ? (
        <EmptyState icon="search-outline" title="No results" subtitle={`Nothing matched "${query.trim()}".`} />
      ) : searched ? (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          windowSize={5}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          renderItem={({ item }) => <ProductCardHorizontal product={item} onPress={() => openProduct(item)} />}
        />
      ) : (
        <View style={styles.recent}>
          {recent.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>Recent searches</Text>
                <Pressable onPress={() => setRecent([])} hitSlop={8}>
                  <Text style={[styles.clear, { color: colors.brandPrimary }]}>Clear</Text>
                </Pressable>
              </View>
              {recent.map((term) => (
                <Pressable
                  key={term}
                  style={[styles.recentRow, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => setQuery(term)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.recentText, { color: colors.textPrimary }]}>{term}</Text>
                  <Ionicons name="arrow-up-outline" size={16} color={colors.textMuted} style={styles.recentArrow} />
                </Pressable>
              ))}
            </>
          ) : (
            <EmptyState
              icon="search-outline"
              title="Search FocusKit"
              subtitle="Find planners, Notion templates, journals, desk tools and more."
            />
          )}
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: Space[3], padding: Space[4] },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Space[2], height: 44, borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: Space[3] },
  input: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, padding: 0 },
  cancel: { fontFamily: FontFamily.semibold, fontSize: FontSize.base },
  list: { paddingHorizontal: Space[4] },
  recent: { paddingHorizontal: Space[4] },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Space[3] },
  recentTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  clear: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingVertical: Space[4], borderBottomWidth: StyleSheet.hairlineWidth },
  recentText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base },
  recentArrow: { transform: [{ rotate: '45deg' }] },
});
