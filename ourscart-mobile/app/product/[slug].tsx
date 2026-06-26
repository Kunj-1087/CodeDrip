import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { useProductActions } from '../../hooks/useProductActions';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { ImageGallery } from '../../components/product/ImageGallery';
import { VariantSelector } from '../../components/product/VariantSelector';
import { SpecPill } from '../../components/product/SpecPill';
import { ReviewCard } from '../../components/product/ReviewCard';
import { StockIndicator } from '../../components/product/StockIndicator';
import { StarRating } from '../../components/ui/StarRating';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ProductDetailSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiGet, apiPost } from '../../lib/api';
import { formatCurrency, savingsAmount, discountPercent, pluralize } from '../../lib/formatters';
import { FontFamily, FontSize, lh, LineHeight } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import type { ProductDetail, ProductVariant, Review } from '../../types';

type Tab = 'description' | 'specifications' | 'reviews';
const TABS: { key: Tab; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'specifications', label: 'Specs' },
  { key: 'reviews', label: 'Reviews' },
];

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useProductActions();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  useScreenPerformance('ProductDetailScreen');

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [tab, setTab] = useState<Tab>('description');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);

  const underline = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - Space[4] * 2) / TABS.length;

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    try {
      const { product: p } = await apiGet<{ product: ProductDetail }>(`/products/${slug}`);
      setProduct(p);
      const firstInStock = p.variants.find((v) => v.stockQuantity > 0) ?? p.variants[0] ?? null;
      setVariant(firstInStock);
      const { reviews: r } = await apiGet<{ reviews: Review[] }>(`/reviews/product/${p.id}`);
      setReviews(r);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectTab = (next: Tab, index: number) => {
    setTab(next);
    Animated.timing(underline, { toValue: index * tabWidth, duration: 200, useNativeDriver: true }).start();
  };

  const unitPrice = useMemo(
    () => (product ? product.basePrice + (variant?.priceModifier ?? 0) : 0),
    [product, variant]
  );
  const stock = variant ? variant.stockQuantity : (product?.stockQuantity ?? 0);
  const off = product ? discountPercent(product.basePrice, product.compareAtPrice) : null;
  const savings = product ? savingsAmount(product.basePrice, product.compareAtPrice) : null;

  const ratingBuckets = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1] += 1;
    });
    return counts;
  }, [reviews]);

  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { timerRef.current.forEach(clearTimeout); };
  }, []);

  const handleAdd = async () => {
    if (!product || stock <= 0) return;
    setAdding(true);
    try {
      await addItem(product.id, variant?.id ?? null, 1);
      setAdded(true);
      const hapticTimer = setTimeout(() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, 200);
      timerRef.current.push(hapticTimer);
      toast.success('Added to cart');
      const resetTimer = setTimeout(() => setAdded(false), 1400);
      timerRef.current.push(resetTimer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} on FocusKit! Price: ${formatCurrency(unitPrice)}. https://focuskit.in/shop/${product.slug}`,
        title: product.name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <SafeScreen>
        <Header title="" />
        <ProductDetailSkeleton />
      </SafeScreen>
    );
  }

  if (error || !product) {
    return (
      <SafeScreen>
        <Header title="Product" />
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this product"
          subtitle="Please check your connection and try again."
          actionLabel="Retry"
          onAction={load}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <Header
        title={product.categoryName}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={handleShare} hitSlop={10} style={styles.cartBtnHeader}>
              <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/cart')} hitSlop={10} style={styles.cartBtnHeader}>
              <Ionicons name="bag-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ImageGallery images={product.images} fallbackUrl={product.imageUrl} />

        <View style={styles.info}>
          <Text style={[styles.brand, { color: colors.textMuted }]}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{product.name}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.specRow}
            contentContainerStyle={styles.specRowContent}
          >
            {Object.entries(product.specs).slice(0, 6).map(([key, value]) => (
              <SpecPill key={key} value={value} />
            ))}
          </ScrollView>

          <Pressable style={styles.ratingRow} onPress={() => selectTab('reviews', 2)}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((idx) => (
                <Ionicons
                  key={idx}
                  name={product.avgRating >= idx ? 'star' : product.avgRating >= idx - 0.5 ? 'star-half' : 'star-outline'}
                  size={14}
                  color={product.avgRating >= idx - 0.5 ? colors.brandPrimary : colors.borderDefault}
                  style={styles.starIcon}
                />
              ))}
            </View>
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>
              {product.avgRating.toFixed(1)} . {pluralize(product.reviewCount, 'review')}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.brandPrimary }]}>{formatCurrency(unitPrice)}</Text>
            {off && product.compareAtPrice ? (
              <Text style={[styles.compareAt, { color: colors.textMuted }]}>
                {formatCurrency(product.compareAtPrice)}
              </Text>
            ) : null}
          </View>

          {savings && off ? (
            <Badge label={`Save ${formatCurrency(savings)} (${off}%)`} variant="success" style={{ marginTop: Space[2] }} />
          ) : null}

          <View style={styles.stock}>
            <StockIndicator stock={stock} />
          </View>

          {product.variants.length > 0 ? (
            <VariantSelector
              label="Options"
              variants={product.variants}
              selectedId={variant?.id ?? null}
              onSelect={setVariant}
            />
          ) : null}
        </View>

        <View style={[styles.tabBar, { borderBottomColor: colors.borderSubtle }]}>
          {TABS.map((t, i) => (
            <Pressable key={t.key} style={[styles.tab, { width: tabWidth }]} onPress={() => selectTab(t.key, i)}>
              <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: tab === t.key ? colors.brandPrimary : colors.textMuted }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
          <Animated.View
            style={[styles.underline, { width: tabWidth, backgroundColor: colors.brandPrimary, transform: [{ translateX: underline }] }]}
          />
        </View>

        <View style={styles.tabContent}>
          {tab === 'description' ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {product.description || product.shortDescription || 'No description available.'}
            </Text>
          ) : null}

          {tab === 'specifications' ? (
            <View>
              {Object.entries(product.specs).map(([key, value], i) => (
                <View key={key} style={[styles.specTableRow, { backgroundColor: i % 2 === 0 ? colors.bgPrimary : colors.bgTertiary }]}>
                  <Text style={[styles.specKey, { color: colors.textSecondary }]}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'reviews' ? (
            <View>
              <View style={styles.distribution}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBuckets[star - 1];
                  const fraction = reviews.length ? count / reviews.length : 0;
                  return (
                    <View key={star} style={styles.distRow}>
                      <Text style={[styles.distStar, { color: colors.textSecondary }]}>{star}*</Text>
                      <View style={[styles.distTrack, { backgroundColor: colors.bgTertiary }]}>
                        <View style={[styles.distFill, { backgroundColor: colors.accentAmber, width: `${fraction * 100}%` }]} />
                      </View>
                      <Text style={[styles.distCount, { color: colors.textMuted }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>

              <Button
                label="Write a Review"
                variant="secondary"
                onPress={() => {
                  if (!isAuthenticated) {
                    toast.info('Sign in to write a review');
                    router.push('/(auth)/login');
                    return;
                  }
                  setReviewModal(true);
                }}
                style={{ marginVertical: Space[4] }}
              />

              {reviews.length === 0 ? (
                <Text style={[styles.noReviews, { color: colors.textMuted }]}>
                  No reviews yet - be the first to review this product.
                </Text>
              ) : (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Space[2], paddingTop: Space[3] },
          Shadows.lg,
        ]}
      >
        <View style={styles.barPrice}>
          <Text style={[styles.barPriceValue, { color: colors.brandPrimary }]}>{formatCurrency(unitPrice)}</Text>
        </View>

        <Pressable
          onPress={() => toggleWishlist(product.id)}
          style={styles.heartBtn}
          accessibilityLabel={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons name={isWishlisted(product.id) ? 'heart' : 'heart-outline'} size={22} color={isWishlisted(product.id) ? colors.accentRed : colors.textSecondary} />
        </Pressable>

        {stock > 0 ? (
          <Button
            label={added ? 'Added' : 'Add to Cart'}
            onPress={handleAdd}
            loading={adding}
            size="md"
            variant="primary"
            icon={added ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : undefined}
            style={styles.addBtn}
          />
        ) : (
          <Button
            label="Notify Me"
            variant="ghost"
            size="md"
            onPress={() => toast.success("We'll notify you when it's back in stock")}
            style={styles.addBtn}
          />
        )}
      </View>

      <WriteReviewModal
        visible={reviewModal}
        onClose={() => setReviewModal(false)}
        productId={product.id}
        onSubmitted={load}
      />
    </SafeScreen>
  );
}

function WriteReviewModal({
  visible,
  onClose,
  productId,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  productId: string;
  onSubmitted: () => void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiPost('/reviews', { productId, rating, title: title.trim(), body: body.trim() });
      toast.success('Thanks for your review!');
      setTitle('');
      setBody('');
      setRating(5);
      onClose();
      onSubmitted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} position="bottom" title="Write a Review">
      <View style={{ gap: Space[4] }}>
        <View>
          <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Your rating</Text>
          <StarRating rating={rating} size={32} onRate={setRating} />
        </View>
        <Input label="Title" placeholder="Summarise your experience" value={title} onChangeText={setTitle} maxLength={120} />
        <Input label="Review" placeholder="What did you like or dislike?" value={body} onChangeText={setBody} multiline numberOfLines={4} maxLength={2000} />
        <Button label="Submit Review" onPress={submit} loading={submitting} fullWidth size="lg" />
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  label: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, marginBottom: Space[2] },
});

const styles = StyleSheet.create({
  cartBtnHeader: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info: { padding: Space[4] },
  brand: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: Space[4] },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], lineHeight: lh(FontSize['2xl'], LineHeight.tight), marginTop: Space[1], letterSpacing: -0.5 },
  specRow: { marginTop: Space[3], flexGrow: 0 },
  specRowContent: { gap: Space[2], alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Space[2], marginTop: Space[3] },
  starsContainer: { flexDirection: 'row', alignItems: 'center' },
  starIcon: { marginRight: 2 },
  ratingText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  divider: { height: 1, marginVertical: Space[4] },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Space[3] },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize['4xl'] },
  compareAt: { fontFamily: FontFamily.regular, fontSize: FontSize.lg, textDecorationLine: 'line-through' },
  stock: { marginTop: Space[3] },
  tabBar: { flexDirection: 'row', marginHorizontal: Space[4], borderBottomWidth: 1 },
  tab: { alignItems: 'center', paddingVertical: Space[3] },
  underline: { position: 'absolute', bottom: 0, height: 2 },
  tabContent: { padding: Space[4] },
  description: { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: lh(FontSize.base, LineHeight.relaxed) },
  specTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[3], paddingHorizontal: Space[4], borderRadius: Radius.sm },
  specKey: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, textTransform: 'capitalize', width: '40%' },
  specValue: { fontFamily: FontFamily.mono, fontSize: FontSize.sm, flex: 1, textAlign: 'left' },
  distribution: { gap: Space[2], marginBottom: Space[2] },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: Space[2] },
  distStar: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, width: 24 },
  distTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  distFill: { height: 8, borderRadius: 4 },
  distCount: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, width: 24, textAlign: 'right' },
  noReviews: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Space[6] },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingHorizontal: Space[4], borderTopWidth: 1 },
  barPrice: { justifyContent: 'center' },
  barPriceValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  heartBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 160 },
});
