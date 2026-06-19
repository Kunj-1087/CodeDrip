'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { StoreSettings } from '@/types';

interface StoreValue {
  settings: StoreSettings | null;
  loading: boolean;
}

const StoreContext = createContext<StoreValue>({ settings: null, loading: true });

// Parse a hex color to [r,g,b]. Returns null for non-hex input.
function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Tailwind tokens expect SPACE-SEPARATED channels: "37 99 235".
function channels(rgb: [number, number, number]): string {
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
}

// Darken a color (for the :hover token) so a single brand color yields a
// coherent primary + primary-hover pair without extra configuration.
function darkenChannels(rgb: [number, number, number], amount = 0.12): string {
  return channels([
    Math.max(0, Math.round(rgb[0] * (1 - amount))),
    Math.max(0, Math.round(rgb[1] * (1 - amount))),
    Math.max(0, Math.round(rgb[2] * (1 - amount))),
  ]);
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
    const primary = hexToRgb(settings.primaryColor);
    const secondary = hexToRgb(settings.secondaryColor);
    const accent = hexToRgb(settings.accentColor);
    // Tokens are RGB channels (e.g. "37 99 235") so Tailwind alpha modifiers work.
    if (primary) {
      root.style.setProperty('--color-primary', channels(primary));
      root.style.setProperty('--color-primary-hover', darkenChannels(primary));
    }
    if (secondary) root.style.setProperty('--color-secondary', channels(secondary));
    if (accent) root.style.setProperty('--color-accent', channels(accent));
  }, [settings]);

  return <StoreContext.Provider value={{ settings, loading }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
