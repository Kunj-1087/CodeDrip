import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../context/ThemeContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Logo } from '../../components/ui/Logo';
import { HeroBanner } from '../../components/home/HeroBanner';
import { CategoryStrip, type CategoryOption } from '../../components/home/CategoryStrip';
import { SectionHeader } from '../../components/home/SectionHeader';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductCardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { apiGet } from '../../lib/api';
import { useProductActions } from '../../hooks/useProductActions';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { FontFamily, FontSize, lh, LineHeight } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { Product, Category } from '../../types';

const TESTIMONIALS = [
  {
    quote: 'The Notion Student Dashboard completely changed how I organize my semester. Everything in one place!',
    author: 'Ananya K., Bengaluru',
    rating: 5,
  },
  {
    quote: 'My desk has never been cleaner. The cable box and organizer tray are game changers for studying at home.',
    author: 'Rohit M., Mumbai',
    rating: 5,
  },
  {
    quote: 'The resume templates helped me land my first internship. Clean, professional, and easy to customize.',
    author: 'Sneha P., Pune',
    rating: 4,
  },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { addToCart, toggleWishlist, isWishlisted } = useProductActions();
  useScreenPerformance('HomeScreen');

  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([{ label: 'All', slug: null }]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const cardWidth = 180;
  const gridCardWidth = (width - Space[4] * 2 - Space[3]) / 2;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [feat, trend, fresh, cats] = await Promise.all([
        apiGet<{ products: Product[] }>('/products/featured'),
        apiGet<{ products: Product[] }>('/products/trending'),
        apiGet<{ products: Product[] }>('/products?sort=newest&limit=4'),
        apiGet<{ categories: Category[] }>('/categories'),
      ]);
      setFeatured(feat.products);
      setBestSellers(trend.products);
      setNewArrivals(fresh.products);
      setCategories([
        { label: 'All', slug: null },
        ...cats.categories.map((c) => ({ label: c.name, slug: c.slug })),
      ]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goToProduct = (slug: string) => router.push(`/product/${slug}`);
  const goToShop = (category?: string | null) =>
    router.push(category ? `/(tabs)/shop?category=${category}` : '/(tabs)/shop');

  const renderCard = (item: Product, cardW: number) => (
    <ProductCard
      product={item}
      width={cardW}
      isWishlisted={isWishlisted(item.id)}
      onPress={() => goToProduct(item.slug)}
      onAddToCart={() => addToCart(item.id, null, 1, item.name)}
      onWishlistToggle={() => toggleWishlist(item.id)}
    />
  );

  const HorizontalRow = ({ data }: { data: Product[] }) =>
    loading ? (
      <View style={styles.hScrollLoading}>
        <ProductCardSkeleton width={cardWidth} />
        <ProductCardSkeleton width={cardWidth} />
      </View>
    ) : (
      <FlatList
        horizontal
        data={data}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
        windowSize={5}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={4}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        renderItem={({ item }) => renderCard(item, cardWidth)}
      />
    );

  if (error && !refreshing) {
    return (
      <SafeScreen>
        <Header
          showBack={false}
          left={<Logo size="md" />}
          right={
            <Pressable onPress={() => router.push('/search')} hitSlop={10} style={styles.searchButton}>
              <Ionicons name="search" size={24} color={colors.textPrimary} />
            </Pressable>
          }
        />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorHeadline, { color: colors.textPrimary }]}>
            Couldn't load the store
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Check your connection and try again
          </Text>
          <Button label="Retry" variant="secondary" onPress={load} style={styles.retryButton} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header
        showBack={false}
        left={<Logo size="md" />}
        right={
          <Pressable onPress={() => router.push('/search')} hitSlop={10} style={styles.searchButton}>
            <Ionicons name="search" size={24} color={colors.textPrimary} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
        }
      >
        {loading ? (
          <Skeleton height={160} radius={Radius.xl} style={styles.heroSkeleton} />
        ) : (
          <HeroBanner onShopPress={() => goToShop('student-planners')} />
        )}

        <View style={styles.strip}>
          {loading ? (
            <View style={styles.categorySkeletonContainer}>
              <Skeleton width={80} height={36} radius={Radius.full} />
              <Skeleton width={80} height={36} radius={Radius.full} />
              <Skeleton width={80} height={36} radius={Radius.full} />
              <Skeleton width={80} height={36} radius={Radius.full} />
            </View>
          ) : (
            <CategoryStrip
              categories={categories}
              selectedSlug={null}
              onSelect={(slug) => goToShop(slug)}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Featured" actionLabel="See all →" onAction={() => goToShop()} />
          <HorizontalRow data={featured} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Best Sellers" actionLabel="See all →" onAction={() => goToShop()} />
          <HorizontalRow data={bestSellers} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Just In" actionLabel="See all →" onAction={() => goToShop()} />
          {loading ? (
            <View style={styles.grid}>
              <ProductCardSkeleton width={gridCardWidth} />
              <ProductCardSkeleton width={gridCardWidth} />
            </View>
          ) : (
            <View style={styles.grid}>
              {newArrivals.map((item) => (
                <View key={item.id} style={{ width: gridCardWidth }}>
                  {renderCard(item, gridCardWidth)}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Productivity Hub Section */}
        <View style={styles.section}>
          <SectionHeader title="Productivity Hub" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
          >
            {/* Desk Setup Guide Card */}
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync('https://focuskit.in/blog/desk-setup-guide-students')}
              style={[
                styles.toolCard,
                { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: colors.brandPrimary + '15' }]}>
                <Ionicons name="desktop-outline" size={24} color={colors.brandPrimary} />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Desk Setup Guide</Text>
                <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                  Create the perfect study workspace with our desk setup tips.
                </Text>
              </View>
              <View style={styles.toolFooter}>
                <Text style={[styles.toolActionText, { color: colors.brandPrimary }]}>Read Guide</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brandPrimary} />
              </View>
            </Pressable>

            {/* Notion Templates Card */}
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync('https://focuskit.in/blog/best-notion-templates-for-students')}
              style={[
                styles.toolCard,
                { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: colors.brandPrimary + '15' }]}>
                <Ionicons name="document-text-outline" size={24} color={colors.brandPrimary} />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Notion Templates Guide</Text>
                <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                  Discover the best Notion templates for student organization.
                </Text>
              </View>
              <View style={styles.toolFooter}>
                <Text style={[styles.toolActionText, { color: colors.brandPrimary }]}>Read Guide</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brandPrimary} />
              </View>
            </Pressable>

            {/* Planner Comparison Card */}
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync('https://focuskit.in/blog/digital-planner-vs-paper-planner')}
              style={[
                styles.toolCard,
                { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: colors.brandPrimary + '15' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.brandPrimary} />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Digital vs Paper Planner</Text>
                <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                  Find out which planning style works best for you.
                </Text>
              </View>
              <View style={styles.toolFooter}>
                <Text style={[styles.toolActionText, { color: colors.brandPrimary }]}>Read Guide</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brandPrimary} />
              </View>
            </Pressable>
          </ScrollView>
        </View>

        {/* Testimonial Section */}
        <View style={styles.section}>
          <SectionHeader title="What students say" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
          >
            {TESTIMONIALS.map((t, i) => (
              <View
                key={i}
                style={[
                  styles.testimonial,
                  { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <Ionicons
                      key={idx}
                      name={t.rating >= idx ? 'star' : 'star-outline'}
                      size={14}
                      color={colors.brandPrimary}
                      style={styles.star}
                    />
                  ))}
                </View>
                <Text style={[styles.quote, { color: colors.textSecondary }]}>"{t.quote}"</Text>
                <View style={styles.tFooter}>
                  <Text style={[styles.author, { color: colors.textPrimary }]}>{t.author}</Text>
                  <Badge label="Verified" variant="neutral" />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Space[4], paddingBottom: Space[10] },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSkeleton: {
    height: 160,
    marginHorizontal: Space[4],
    marginBottom: Space[4],
  },
  categorySkeletonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Space[4],
    gap: Space[2],
  },
  strip: { marginTop: Space[5], marginBottom: Space[2] },
  section: { marginTop: Space[6] },
  hList: { paddingHorizontal: Space[4], gap: Space[3] },
  hScrollLoading: { flexDirection: 'row', paddingHorizontal: Space[4], gap: Space[3] },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Space[4],
    gap: Space[3],
  },
  testimonial: {
    width: 280,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Space[4],
  },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 2 },
  quote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm, LineHeight.relaxed),
    fontStyle: 'italic',
    marginVertical: Space[2],
  },
  tFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space[4],
  },
  author: { fontFamily: FontFamily.semibold, fontSize: FontSize.xs },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space[6],
    marginTop: Space[12],
  },
  errorHeadline: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xl,
    marginTop: Space[4],
    textAlign: 'center',
  },
  errorSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    marginTop: Space[2],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Space[5],
    width: 160,
    alignSelf: 'center',
  },
  toolCard: {
    width: 240,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Space[4],
    justifyContent: 'space-between',
  },
  toolIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space[3],
  },
  toolTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    marginBottom: 4,
  },
  toolDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: lh(FontSize.xs, LineHeight.normal),
    marginBottom: Space[3],
  },
  toolFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
  },
  toolActionText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xs,
  },
});
