'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  basePrice: number;
  inStock: boolean;
  imageUrl: string | null;
}

const STORAGE_KEY = 'codedrip_wishlist';

function getLocalWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setLocalWishlist(items: WishlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useWishlist() {
  const { status } = useAuth();
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (status === 'authenticated') {
      try {
        const res = await api.get<{ items: WishlistItem[] }>('/wishlist');
        setItems(res.items);
      } catch {
        setItems(getLocalWishlist());
      }
    } else {
      setItems(getLocalWishlist());
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    if (status === 'loading') return;
    void refresh();
  }, [status, refresh]);

  const addItem = useCallback(async (product: WishlistItem) => {
    if (status === 'authenticated') {
      try {
        await api.post(`/wishlist/${product.productId}`);
      } catch {}
    }
    const current = getLocalWishlist();
    if (!current.some((i) => i.productId === product.productId)) {
      const updated = [...current, product];
      setLocalWishlist(updated);
      setItems(updated);
    }
  }, [status]);

  const removeItem = useCallback(async (productId: string) => {
    if (status === 'authenticated') {
      try {
        await api.del(`/wishlist/${productId}`);
      } catch {}
    }
    const current = getLocalWishlist();
    const updated = current.filter((i) => i.productId !== productId);
    setLocalWishlist(updated);
    setItems(updated);
  }, [status]);

  const isSaved = useCallback((productId: string) => {
    if (!items) return false;
    return items.some((i) => i.productId === productId);
  }, [items]);

  return { items, loading, refresh, addItem, removeItem, isSaved };
}
