// =============================================================================
// Cancellable data-fetching hook.
//
// Prevents the classic React Native memory leak pattern: a component starts a
// fetch, navigates away, and the response callback calls setState on an
// unmounted component. The `mountedRef` pattern guards every async path.
// =============================================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet } from '../lib/api';
import type { APIError } from '../lib/api';

export function useFetch<T>(
  path: string | null,
  deps: unknown[] = [],
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);

    try {
      const result = await apiGet<T>(path);
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        if (err instanceof Error && 'status' in err) {
          const apiErr = err as APIError;
          setError(apiErr.message || 'Request failed');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  return { data, loading, error, refetch: fetchData };
}
