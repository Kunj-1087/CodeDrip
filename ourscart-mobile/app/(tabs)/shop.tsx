import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Slider } from '@miblanchard/react-native-slider';
import { useTheme } from '../../context/ThemeContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { usePagination } from '../../hooks/usePagination';
import { useProductActions } from '../../hooks/useProductActions';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import type { Product, ProductListResponse, ProductSort, Category } from '../../types';

const PRICE_MAX = 25000;
const SORTS: { label: string; value: ProductSort }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Name (A-Z)', value: 'name' },
];

export default function ShopScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();
  const { addToCart, toggleWishlist, isWishlisted } = useProductActions();
  useScreenPerformance('ShopScreen');

  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [sort, setSort] = useState<ProductSort>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const filterSheet = useRef<BottomSheetModal>(null);
  const sortSheet = useRef<BottomSheetModal>(null);

  useEffect(() => {
    apiGet<{ categories: Category[] }>('/categories')
      .then((r) => setCategories(r.categories))
      .catch(() => undefined);
  }, []);

  const gridCardWidth = (width - Space[4] * 2 - Space[3]) / 2;

  const fetcher = useCallback(
    (page: number) => {
      const qs = new URLSearchParams({ page: String(page), limit: '12', sort });
      if (category) qs.set('category', category);
      if (priceRange[0] > 0) qs.set('minPrice', String(priceRange[0]));
      if (priceRange[1] < PRICE_MAX) qs.set('maxPrice', String(priceRange[1]));
      return apiGet<ProductListResponse>(`/products?${qs.toString()}`).then((r) => ({
        items: r.products,
        pagination: r.pagination,
      }));
    },
    [category, sort, priceRange]
  );

  const { items, loading, loadingMore, refreshing, hasMore, loadMore, refresh } =
    usePagination<Product>(fetcher);

  const availableBrands = useMemo(
    () => Array.from(new Set(items.map((p) => p.brand))).sort(),
    [items]
  );

  const visible = useMemo(
    () =>
      items.filter((p) => {
        if (inStockOnly && !p.inStock) return false;
        if (onSaleOnly && !(p.compareAtPrice && p.compareAtPrice > p.basePrice)) return false;
        if (brands.size > 0 && !brands.has(p.brand)) return false;
        if (minRating > 0 && p.avgRating < minRating) return false;
        return true;
      }),
    [items, inStockOnly, onSaleOnly, brands, minRating]
  );

  const activeFilterCount =
    (category ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    brands.size +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < PRICE_MAX ? 1 : 0);

  const clearAll = () => {
    setCategory(null);
    setPriceRange([0, PRICE_MAX]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setBrands(new Set());
    setMinRating(0);
  };

  const toggleBrand = (brand: string) =>
    setBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const CustomCheckbox = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) => (
    <Pressable onPress={onPress} style={styles.checkboxRow} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? colors.brandPrimary : colors.borderDefault,
            backgroundColor: checked ? colors.brandPrimary : colors.transparent,
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );

  const CustomRadio = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) => (
    <Pressable onPress={onPress} style={styles.checkboxRow} accessibilityRole="radio" accessibilityState={{ checked }}>
      <View
        style={[styles.radio, { borderColor: checked ? colors.brandPrimary : colors.borderDefault }]}
      >
        {checked && <View style={[styles.radioInner, { backgroundColor: colors.brandPrimary }]} />}
      </View>
      <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeScreen>
      <Header title="Shop" showBack={false} />

      <View style={[styles.controls, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable
          onPress={() => router.push('/search')}
          style={[styles.search, { backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <Text style={[styles.searchText, { color: colors.textMuted }]}>Search planners, templates, notebooks...</Text>
        </Pressable>

        <View style={styles.chipRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Pressable
              onPress={() => filterSheet.current?.present()}
              style={[
                styles.chip,
                { backgroundColor: colors.bgSecondary, borderColor: activeFilterCount > 0 ? colors.brandPrimary : colors.borderDefault },
              ]}
            >
              <Ionicons name="options-outline" size={14} color={activeFilterCount > 0 ? colors.brandPrimary : colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: activeFilterCount > 0 ? colors.brandPrimary : colors.textSecondary }}>
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Text>
            </Pressable>

            {category && (
              <Pressable
                onPress={() => setCategory(null)}
                style={[styles.chip, styles.activeChip, { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}
              >
                <Text style={[styles.chipTextActive]}>
                  {categories.find((c) => c.slug === category)?.name || category}
                </Text>
                <Ionicons name="close" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </Pressable>
            )}

            <Pressable
              onPress={() => setInStockOnly((v) => !v)}
              style={[
                styles.chip,
                inStockOnly ? styles.activeChip : null,
                { backgroundColor: inStockOnly ? colors.brandPrimary : colors.bgSecondary, borderColor: inStockOnly ? colors.brandPrimary : colors.borderDefault },
              ]}
            >
              <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: inStockOnly ? '#FFFFFF' : colors.textSecondary }}>
                In Stock
              </Text>
              {inStockOnly && <Ionicons name="close" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
            </Pressable>

            <Pressable
              onPress={() => setOnSaleOnly((v) => !v)}
              style={[
                styles.chip,
                onSaleOnly ? styles.activeChip : null,
                { backgroundColor: onSaleOnly ? colors.brandPrimary : colors.bgSecondary, borderColor: onSaleOnly ? colors.brandPrimary : colors.borderDefault },
              ]}
            >
              <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: onSaleOnly ? '#FFFFFF' : colors.textSecondary }}>
                On Sale
              </Text>
              {onSaleOnly && <Ionicons name="close" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
            </Pressable>

            {Array.from(brands).map((b) => (
              <Pressable
                key={b}
                onPress={() => toggleBrand(b)}
                style={[styles.chip, styles.activeChip, { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}
              >
                <Text style={[styles.chipTextActive]}>{b}</Text>
                <Ionicons name="close" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.resultsRow}>
        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
          {visible.length} {visible.length === 1 ? 'product' : 'products'}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          label={`Sort: ${SORTS.find((s) => s.value === sort)?.label || 'Sort'}`}
          icon={<Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />}
          onPress={() => sortSheet.current?.present()}
          style={styles.sortButton}
        />
      </View>

      {loading ? (
        <View style={styles.gridLoading}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} width={gridCardWidth} />
          ))}
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={refreshing}
          onEndReached={() => hasMore && loadMore()}
          onEndReachedThreshold={0.2}
          windowSize={5}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ width: gridCardWidth }}>
              <ProductCard
                product={item}
                width={gridCardWidth}
                isWishlisted={isWishlisted(item.id)}
                onPress={() => router.push(`/product/${item.slug}`)}
                onAddToCart={() => addToCart(item.id, null, 1, item.name)}
                onWishlistToggle={() => toggleWishlist(item.id)}
              />
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.brandPrimary} style={{ marginVertical: Space[5] }} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No products found"
              subtitle="Try adjusting your filters or search something different"
              actionLabel={activeFilterCount > 0 ? 'Clear Filters' : undefined}
              onAction={activeFilterCount > 0 ? clearAll : undefined}
            />
          }
        />
      )}

      <BottomSheetModal
        ref={sortSheet}
        snapPoints={['45%']}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.borderDefault }}
        backgroundStyle={{ backgroundColor: colors.bgPrimary }}
      >
        <BottomSheetView style={styles.sheet}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Sort by</Text>
          {SORTS.map((option) => (
            <Pressable
              key={option.value}
              style={styles.sortRow}
              onPress={() => {
                setSort(option.value);
                sortSheet.current?.dismiss();
              }}
            >
              <Text style={[styles.sortLabel, { color: colors.textPrimary }]}>{option.label}</Text>
              {sort === option.value ? (
                <Ionicons name="checkmark" size={20} color={colors.brandPrimary} />
              ) : null}
            </Pressable>
          ))}
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={filterSheet}
        snapPoints={['85%']}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={{ backgroundColor: colors.bgPrimary }}
      >
        <BottomSheetView style={styles.sheet}>
          <View style={[styles.customHandle, { backgroundColor: colors.borderDefault }]} />
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Filters</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Category</Text>
            <View style={styles.filterSection}>
              <CustomRadio checked={!category} onPress={() => setCategory(null)} label="All Categories" />
              {categories.map((c) => (
                <CustomRadio
                  key={c.id}
                  checked={category === c.slug}
                  onPress={() => setCategory(c.slug)}
                  label={c.name}
                />
              ))}
            </View>

            <Text style={[styles.filterLabel, { color: colors.textMuted, marginTop: Space[4] }]}>Price Range</Text>
            <View style={styles.filterSection}>
              <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                {priceRange[1] >= PRICE_MAX ? '+' : ''}
              </Text>
              <Slider
                value={priceRange}
                minimumValue={0}
                maximumValue={PRICE_MAX}
                step={500}
                onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                minimumTrackTintColor={colors.brandPrimary}
                maximumTrackTintColor={colors.borderDefault}
                thumbStyle={StyleSheet.flatten([
                  styles.sliderThumb,
                  isDark ? Shadows.lg : Shadows.md,
                  { borderColor: colors.borderSubtle },
                ])}
                trackStyle={styles.sliderTrack}
              />
            </View>

            {availableBrands.length > 0 && (
              <>
                <Text style={[styles.filterLabel, { color: colors.textMuted, marginTop: Space[4] }]}>Brand</Text>
                <View style={styles.filterSection}>
                  {availableBrands.map((brand) => (
                    <CustomCheckbox
                      key={brand}
                      checked={brands.has(brand)}
                      onPress={() => toggleBrand(brand)}
                      label={brand}
                    />
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.filterLabel, { color: colors.textMuted, marginTop: Space[4] }]}>Minimum Rating</Text>
            <View style={[styles.filterSection, styles.ratingFilterRow]}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setMinRating(minRating === star ? 0 : star)}
                  style={styles.ratingStarBtn}
                  hitSlop={6}
                >
                  <Ionicons
                    name={minRating >= star ? 'star' : 'star-outline'}
                    size={28}
                    color={minRating >= star ? colors.brandPrimary : colors.borderDefault}
                  />
                </Pressable>
              ))}
              {minRating > 0 && (
                <Pressable onPress={() => setMinRating(0)} style={styles.clearRatingBtn}>
                  <Text style={{ color: colors.brandPrimary, fontFamily: FontFamily.medium, fontSize: FontSize.sm }}>
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>

            <Text style={[styles.filterLabel, { color: colors.textMuted, marginTop: Space[4] }]}>Availability</Text>
            <View style={styles.filterSection}>
              <CustomCheckbox checked={inStockOnly} onPress={() => setInStockOnly(!inStockOnly)} label="In Stock Only" />
              <CustomCheckbox checked={onSaleOnly} onPress={() => setOnSaleOnly(!onSaleOnly)} label="On Sale Only" />
            </View>
          </ScrollView>

          <View style={[styles.sheetActions, { borderTopColor: colors.borderSubtle }]}>
            <Button variant="ghost" label="Clear All" onPress={clearAll} style={styles.clearBtnStyle} />
            <View style={{ flex: 1 }}>
              <Button variant="primary" label="Apply Filters" onPress={() => filterSheet.current?.dismiss()} fullWidth />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: Space[4], paddingBottom: Space[3], borderBottomWidth: 1 },
  search: { flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space[4], marginTop: Space[2] },
  searchIcon: { marginRight: Space[2] },
  searchText: { fontFamily: FontFamily.regular, fontSize: FontSize.base },
  chipRow: { flexDirection: 'row', alignItems: 'center', marginTop: Space[3] },
  chips: { gap: Space[2], alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Space[4] },
  activeChip: { borderColor: 'transparent' },
  chipTextActive: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: '#FFFFFF' },
  resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space[4], marginTop: Space[3], marginBottom: Space[1] },
  resultsCount: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  sortButton: { paddingHorizontal: 0, height: 32, minWidth: 80 },
  grid: { padding: Space[4], gap: Space[3], paddingBottom: Space[10] },
  gridLoading: { flexDirection: 'row', flexWrap: 'wrap', padding: Space[4], gap: Space[3] },
  column: { gap: Space[3] },
  sheet: { flex: 1, paddingHorizontal: Space[5], paddingBottom: Space[6] },
  sheetHandle: { display: 'none' },
  customHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: Space[2], marginBottom: Space[4] },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, marginBottom: Space[4] },
  filterScroll: { paddingBottom: Space[8] },
  filterLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Space[2] },
  filterSection: { marginBottom: Space[4] },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Space[3] },
  sortLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[2], gap: Space[3] },
  checkbox: { width: 20, height: 20, borderRadius: Radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
  radio: { width: 20, height: 20, borderRadius: Radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: Radius.full },
  priceText: { fontFamily: FontFamily.semibold, fontSize: FontSize.base, marginBottom: Space[2] },
  sliderTrack: { height: 4, borderRadius: 2 },
  sliderThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1 },
  ratingFilterRow: { flexDirection: 'row', alignItems: 'center', gap: Space[3] },
  ratingStarBtn: { paddingVertical: Space[1] },
  clearRatingBtn: { marginLeft: Space[2], paddingHorizontal: Space[2] },
  sheetActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: Space[4], gap: Space[3] },
  clearBtnStyle: { minWidth: 100 },
});
