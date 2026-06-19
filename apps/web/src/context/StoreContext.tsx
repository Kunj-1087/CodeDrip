'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { StoreSettings } from '@/types';

interface StoreValue {
  settings: StoreSettings | null;
  loading: boolean;
}

const StoreContext = createContext<StoreValue>({ settings: null, loading: true });

// Slightly darken a hex color for the :hover token, so a single brand color in
// the DB yields a coherent primary + primary-hover pair without extra config.
function darken(hex: string, amount = 0.12): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function StoreProvider({
  initialSettings = null,
  children,
}: {
  initialSettings?: StoreSettings | null;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<StoreSettings | null>(initialSettings);
  const [loading, setLoading] = useState(!initialSettings);

  useEffect(() => {
    let cancelled = false;
    api
      .get<StoreSettings>('/store-settings')
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply the brand palette as CSS variables — this is the white-label hook:
  // changing the store_settings row recolors the entire UI with no code change.
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primaryColor);
    root.style.setProperty('--color-primary-hover', darken(settings.primaryColor));
    root.style.setProperty('--color-secondary', settings.secondaryColor);
    root.style.setProperty('--color-accent', settings.accentColor);
  }, [settings]);

  return <StoreContext.Provider value={{ settings, loading }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
