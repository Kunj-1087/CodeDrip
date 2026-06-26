'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@/types';

// Compare tray. Holds up to MAX products the shopper has flagged to compare
// side-by-side. We store the whole Product (listing responses already include
// specs) so the /compare page needs no refetch, and persist to localStorage so
// the selection survives navigation and refresh. Context, not Zustand — matches
// the rest of the app's state approach.
const MAX = 4;
const STORAGE_KEY = 'focuskit_compare';

interface CompareValue {
  items: Product[];
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  full: boolean;
}

const CompareContext = createContext<CompareValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  // Hydrate from localStorage after mount (avoids SSR/client mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt/blocked storage */
    }
  }, []);

  const persist = useCallback((next: Product[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const has = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  const toggle = useCallback(
    (product: Product) => {
      const exists = items.some((p) => p.id === product.id);
      if (exists) persist(items.filter((p) => p.id !== product.id));
      else if (items.length < MAX) persist([...items, product]);
      // At MAX we silently ignore — the UI disables the control and explains why.
    },
    [items, persist],
  );

  const remove = useCallback((id: string) => persist(items.filter((p) => p.id !== id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);

  return (
    <CompareContext.Provider value={{ items, has, toggle, remove, clear, full: items.length >= MAX }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

export const COMPARE_MAX = MAX;
