import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

/**
 * Shared add-to-cart / wishlist behaviour so every surface (home, shop, wishlist,
 * detail) gets identical haptics, toasts and auth-gating. Keeps screens declarative.
 */
export function useProductActions() {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const toast = useToast();

  const addToCart = useCallback(
    async (productId: string, variantId: string | null = null, quantity = 1, name?: string) => {
      try {
        await addItem(productId, variantId, quantity);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(name ? `${name} added to cart` : 'Added to cart');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not add to cart');
      }
    },
    [addItem, toast],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      Haptics.selectionAsync();
      const handled = await toggle(productId);
      if (!handled) {
        toast.info('Sign in to save favourites');
        router.push('/(auth)/login');
      }
    },
    [toggle, toast],
  );

  return { addToCart, toggleWishlist, isWishlisted };
}
