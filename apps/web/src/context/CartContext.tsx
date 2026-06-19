'use client';
import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { getGuestSessionId } from '@/lib/session';
import { useAuth } from './AuthContext';
import type { Cart } from '@/types';

interface CartState extends Cart {
  loading: boolean;
}

const EMPTY: CartState = { items: [], subtotal: 0, itemCount: 0, loading: true };

type Action = { type: 'SET'; cart: Cart } | { type: 'LOADING' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'SET':
      return { ...action.cart, loading: false };
    case 'LOADING':
      return { ...state, loading: true };
    default:
      return state;
  }
}

interface CartValue extends CartState {
  addItem: (productId: string, quantity?: number, variantId?: string | null) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const { status, user } = useAuth();

  // Logged-in requests ride the cookie; guests carry X-Session-Id.
  const sessionOpts = useCallback(() => (user ? {} : { sessionId: getGuestSessionId() }), [user]);

  const refresh = useCallback(async () => {
    try {
      const cart = await api.get<Cart>('/cart', sessionOpts());
      dispatch({ type: 'SET', cart });
    } catch {
      dispatch({ type: 'SET', cart: { items: [], subtotal: 0, itemCount: 0 } });
    }
  }, [sessionOpts]);

  // Refetch whenever auth resolves or the user changes (post-login the server
  // has already merged the guest cart, so this pulls the unified cart).
  useEffect(() => {
    if (status === 'loading') return;
    void refresh();
  }, [status, user?.id, refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1, variantId: string | null = null) => {
      const cart = await api.post<Cart>('/cart/items', { productId, quantity, variantId }, sessionOpts());
      dispatch({ type: 'SET', cart });
    },
    [sessionOpts],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const cart = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity }, sessionOpts());
      dispatch({ type: 'SET', cart });
    },
    [sessionOpts],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const cart = await api.del<Cart>(`/cart/items/${itemId}`, sessionOpts());
      dispatch({ type: 'SET', cart });
    },
    [sessionOpts],
  );

  const clear = useCallback(async () => {
    const cart = await api.del<Cart>('/cart', sessionOpts());
    dispatch({ type: 'SET', cart });
  }, [sessionOpts]);

  return (
    <CartContext.Provider value={{ ...state, addItem, updateQuantity, removeItem, clear, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
