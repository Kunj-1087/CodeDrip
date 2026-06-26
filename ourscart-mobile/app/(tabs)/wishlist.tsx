import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../hooks/useAuth';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { useProductActions } from '../../hooks/useProductActions';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { Space } from '../../constants/spacing';
import type { Product, WishlistItem } from '../../types';

// WishlistItem carries less than a full Product; ProductCard tolerates the gaps
// (empty specs, no compare-at) so we adapt rather than maintain a second card.
function toProduct(item: WishlistItem): Product {
  return {
    id: item.productId,
    name: item.name,
    slug: item.slug,
    shortDescription: null,
    description: null,
    sku: '',
    brand: '',
    basePrice: item.basePrice,
    compareAtPrice: null,
    stockQuantity: item.inStock ? 10 : 0,
    inStock: item.inStock,
    isFeatured: false,
    specs: {},
    avgRating: 0,
    reviewCount: 0,
    categoryName: '',
    categorySlug: '',
    imageUrl: item.imageUrl,
  };
}

export default function WishlistScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { items, loading, refresh } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { addToCart, toggleWishlist } = useProductActions();
  useScreenPerformance('WishlistScreen');

  const [selected, setSelected] = useState<WishlistItem | null>(null);
  const gridCardWidth = (width - Space[4] * 2 - Space[3]) / 2;

  if (!isAuthenticated) {
    return (
      <SafeScreen>
        <Header title="Wishlist" showBack={false} />
        <EmptyState
          icon="heart-outline"
          title="Save your favourites"
          subtitle="Sign in to keep a wishlist that syncs across your devices."
          actionLabel="Sign In"
          onAction={() => router.push('/(auth)/login')}
        />
      </SafeScreen>
    );
  }

  if (loading && items.length === 0) {
    return (
      <SafeScreen>
        <Header title="Wishlist" showBack={false} />
        <View style={styles.gridLoading}>
          <ProductCardSkeleton width={gridCardWidth} />
          <ProductCardSkeleton width={gridCardWidth} />
        </View>
      </SafeScreen>
    );
  }

  if (items.length === 0) {
    return (
      <SafeScreen>
        <Header title="Wishlist" showBack={false} />
        <EmptyState
          icon="heart-outline"
          title="No favourites yet"
          subtitle="Tap the heart on any product to save it here."
          actionLabel="Browse Products"
          onAction={() => router.push('/(tabs)/shop')}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header title={`Wishlist (${items.length})`} showBack={false} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        windowSize={5}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.2}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => setSelected(item)}
            delayLongPress={250}
            style={{ width: gridCardWidth }}
          >
            <ProductCard
              product={toProduct(item)}
              width={gridCardWidth}
              isWishlisted
              onPress={() => router.push(`/product/${item.slug}`)}
              onAddToCart={() => addToCart(item.productId, null, 1, item.name)}
              onWishlistToggle={() => toggleWishlist(item.productId)}
            />
          </Pressable>
        )}
      />

      <Modal visible={!!selected} onClose={() => setSelected(null)} position="bottom" title={selected?.name}>
        <View style={styles.sheetActions}>
          <Button
            label="Add to Cart"
            fullWidth
            onPress={() => {
              if (selected) addToCart(selected.productId, null, 1, selected.name);
              setSelected(null);
            }}
          />
          <Button
            label="Remove from Wishlist"
            variant="danger"
            fullWidth
            onPress={() => {
              if (selected) toggleWishlist(selected.productId);
              setSelected(null);
            }}
          />
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  grid: { padding: Space[4], gap: Space[3] },
  gridLoading: { flexDirection: 'row', padding: Space[4], gap: Space[3] },
  column: { gap: Space[3] },
  sheetActions: { gap: Space[3] },
});
