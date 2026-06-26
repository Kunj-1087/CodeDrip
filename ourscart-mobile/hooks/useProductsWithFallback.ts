// =============================================================================
// Data-fetching hook with local cache fallback.
//
// When the API is unreachable (common on Indian mobile networks with patchy
// coverage), this hook serves previously-cached data so the user never sees a
// blank screen. The stale indicator lets the UI show a subtle banner like
// "Showing cached data — pull to refresh".
//
// Use for: home screen featured products, category list, shop product grid.
// Do NOT use for: cart, checkout, orders — those must always be fresh.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import { apiGet } from '../lib/api';

const CACHE_PREFIX = 'focuskit_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
  data: T;
  cachedAt: number;
}

export function useProductsWithFallback<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const cacheKey = `${CACHE_PREFIX}${path}`;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const loadData = async () => {
      // Try fresh data from API first.
      try {
        const fresh = await apiGet<T>(path);
        if (mountedRef.current) {
          setData(fresh);
          setIsFromCache(false);
          setError(null);
          // Cache the fresh result for offline fallback.
          AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({ data: fresh, cachedAt: Date.now() } as CachedData<T>),
          ).catch(() => {});
        }
      } catch {
        // API failed — try cache.
        if (!mountedRef.current) return;
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const parsed: CachedData<T> = JSON.parse(cached);
            const isStale = Date.now() - parsed.cachedAt > CACHE_TTL_MS;
            setData(parsed.data);
            setIsFromCache(true);
            setError(isStale ? 'Showing cached data — pull to refresh' : null);
          } else {
            setError('No connection. Check your internet and try again.');
          }
        } catch {
          setError('Failed to load. Please try again.');
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [path, cacheKey]);

  return { data, loading, error, isFromCache };
}
