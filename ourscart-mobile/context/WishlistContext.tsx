import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/api';
import type { WishlistItem } from '../types';
import { useAuth } from './AuthContext';

// The wishlist is server-owned and auth-gated. We keep a Set of product ids in memory
// so every ProductCard across the app can render its heart state without re-fetching,
// plus the full item list for the wishlist tab.

interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  /** Returns false when the user isn't signed in (caller prompts login). */
  toggle: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { items: list } = await apiGet<{ items: WishlistItem[] }>('/wishlist');
      setItems(list);
      setIds(new Set(list.map((i) => i.productId)));
    } catch {
      /* leave previous state on transient errors */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!initializing) void refresh();
  }, [initializing, isAuthenticated, refresh]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;
      const wasWishlisted = ids.has(productId);

      // Optimistic flip of the id set so the heart responds instantly.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasWishlisted) {
          await apiDelete(`/wishlist/${productId}`);
          setItems((prev) => prev.filter((i) => i.productId !== productId));
        } else {
          await apiPost(`/wishlist/${productId}`);
          await refresh(); // pull the full item (name/price/image) for the list view
        }
      } catch {
        void refresh(); // reconcile with the server on failure
      }
      return true;
    },
    [isAuthenticated, ids, refresh],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ items, loading, isWishlisted, toggle, refresh }),
    [items, loading, isWishlisted, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
