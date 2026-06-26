import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import type { Cart, CartItem, CouponResult } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// The server owns cart truth (prices, stock, totals). This context is a thin,
// optimistic cache around the /cart endpoints plus a client-side coupon preview
// that gets handed to /orders at checkout.

const CART_STORAGE_KEY = 'focuskit_guest_cart';

interface AppliedCoupon {
  code: string;
  discount: number;
}

interface CartState {
  cart: Cart;
  loading: boolean;
  mutating: boolean;
  coupon: AppliedCoupon | null;
}

type CartAction =
  | { type: 'LOADING' }
  | { type: 'SET_CART'; cart: Cart }
  | { type: 'MUTATING'; value: boolean }
  | { type: 'SET_COUPON'; coupon: AppliedCoupon | null }
  | { type: 'ADD_ITEM_OPTIMISTIC'; payload: CartItem }
  | { type: 'CONFIRM_ADD_ITEM'; payload: { tempId: string; item: CartItem } }
  | { type: 'ROLLBACK_ADD_ITEM'; payload: string }
  | { type: 'LOAD_GUEST_CART'; payload: CartItem[] };

const EMPTY_CART: Cart = { items: [], subtotal: 0, itemCount: 0 };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true };
    case 'SET_CART':
      return { ...state, cart: action.cart, loading: false };
    case 'MUTATING':
      return { ...state, mutating: action.value };
    case 'SET_COUPON':
      return { ...state, coupon: action.coupon };
    case 'ADD_ITEM_OPTIMISTIC': {
      const items = [...state.cart.items, action.payload];
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...state, cart: { ...state.cart, items, itemCount }, mutating: true };
    }
    case 'CONFIRM_ADD_ITEM': {
      const items = state.cart.items.map((i) =>
        i.id === action.payload.tempId ? action.payload.item : i,
      );
      const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      return {
        ...state,
        cart: { items, subtotal, itemCount },
        mutating: false,
      };
    }
    case 'ROLLBACK_ADD_ITEM': {
      const items = state.cart.items.filter((i) => i.id !== action.payload);
      const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      return {
        ...state,
        cart: { items, subtotal, itemCount },
        mutating: false,
      };
    }
    case 'LOAD_GUEST_CART': {
      const items = action.payload;
      const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...state, cart: { items, subtotal, itemCount }, loading: false };
    }
    default:
      return state;
  }
}

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  loading: boolean;
  mutating: boolean;
  coupon: AppliedCoupon | null;
  refresh: () => Promise<void>;
  addItem: (productId: string, variantId: string | null, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  applyCoupon: (code: string) => Promise<CouponResult>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    cart: EMPTY_CART,
    loading: true,
    mutating: false,
    coupon: null,
  });
  const { user, initializing } = useAuth();
  const toast = useToast();

  const refresh = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const cart = await apiGet<Cart>('/cart');
      dispatch({ type: 'SET_CART', cart });
    } catch {
      dispatch({ type: 'SET_CART', cart: EMPTY_CART });
    }
  }, []);

  // (Re)load the cart once auth state settles and whenever the user identity flips
  // (login merges the guest cart server-side, logout reverts to the guest cart).
  useEffect(() => {
    if (!initializing) void refresh();
  }, [initializing, user?.id, refresh]);

  // Persist guest cart to AsyncStorage whenever it changes.
  useEffect(() => {
    if (!user && !initializing) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart.items)).catch(() => {});
    }
  }, [state.cart.items, user, initializing]);

  // Load guest cart from AsyncStorage on app start for non-auth users.
  useEffect(() => {
    if (!user && !initializing && state.cart.items.length === 0 && !state.loading) {
      AsyncStorage.getItem(CART_STORAGE_KEY)
        .then((stored) => {
          if (stored) {
            const items = JSON.parse(stored) as CartItem[];
            if (items.length > 0) {
              dispatch({ type: 'LOAD_GUEST_CART', payload: items });
            }
          }
        })
        .catch(() => {});
    }
  }, [user, initializing]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback(
    async (productId: string, variantId: string | null, quantity = 1) => {
      // Optimistic update — update UI immediately.
      const tempItem: CartItem = {
        id: `temp-${Date.now()}`,
        productId,
        variantId: variantId ?? null,
        name: '',
        slug: '',
        imageUrl: null,
        unitPrice: 0,
        quantity,
        lineTotal: 0,
        stockQuantity: 99,
      };
      dispatch({ type: 'ADD_ITEM_OPTIMISTIC', payload: tempItem });

      try {
        const cart = await apiPost<Cart>('/cart/items', { productId, variantId, quantity });
        dispatch({ type: 'SET_CART', cart });
        toast.success('Added to cart');
      } catch (error) {
        // Rollback the optimistic item on failure.
        dispatch({ type: 'ROLLBACK_ADD_ITEM', payload: tempItem.id });
        const message = error instanceof Error ? error.message : 'Failed to add to cart';
        toast.error(message);
      }
    },
    [toast],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      dispatch({ type: 'MUTATING', value: true });
      try {
        const cart = await apiPatch<Cart>(`/cart/items/${itemId}`, { quantity });
        dispatch({ type: 'SET_CART', cart });
      } catch {
        // Revert to server state on failure.
        await refresh();
      } finally {
        dispatch({ type: 'MUTATING', value: false });
      }
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      dispatch({ type: 'MUTATING', value: true });
      try {
        const cart = await apiDelete<Cart>(`/cart/items/${itemId}`);
        dispatch({ type: 'SET_CART', cart });
      } catch {
        await refresh();
      } finally {
        dispatch({ type: 'MUTATING', value: false });
      }
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    const cart = await apiDelete<Cart>('/cart');
    dispatch({ type: 'SET_CART', cart });
    dispatch({ type: 'SET_COUPON', coupon: null });
  }, []);

  const applyCoupon = useCallback(
    async (code: string): Promise<CouponResult> => {
      const result = await apiPost<CouponResult>('/coupons/validate', {
        code: code.trim().toUpperCase(),
        subtotal: state.cart.subtotal,
      });
      if (result.valid) {
        dispatch({
          type: 'SET_COUPON',
          coupon: { code: result.code, discount: result.discount },
        });
      }
      return result;
    },
    [state.cart.subtotal],
  );

  const removeCoupon = useCallback(() => dispatch({ type: 'SET_COUPON', coupon: null }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart: state.cart,
      itemCount: state.cart.itemCount,
      loading: state.loading,
      mutating: state.mutating,
      coupon: state.coupon,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
    }),
    [state, refresh, addItem, updateQuantity, removeItem, clear, applyCoupon, removeCoupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

export type { CartItem };
