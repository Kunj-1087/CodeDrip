import { useCallback, useEffect, useRef, useState } from 'react';
import type { Pagination } from '../types';

interface Page<T> {
  items: T[];
  pagination: Pagination;
}

type Fetcher<T> = (page: number) => Promise<Page<T>>;

export interface PaginationState<T> {
  items: T[];
  loading: boolean; // first page
  loadingMore: boolean; // subsequent pages
  refreshing: boolean; // pull-to-refresh
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  /** Re-run from page 1 (e.g. when filters change). The fetcher identity drives this. */
  reload: () => void;
}

/**
 * Generic infinite-list controller for any endpoint returning { items, pagination }.
 * Pass a memoized `fetcher` (wrap filter deps in useCallback) — when it changes the
 * list resets to page 1.
 */
export function usePagination<T>(fetcher: Fetcher<T>): PaginationState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against overlapping fetches and against setState after a fetcher swap.
  const inFlight = useRef(false);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'more' | 'refresh') => {
      if (inFlight.current) return;
      inFlight.current = true;
      const myRequest = ++requestId.current;

      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);

      try {
        const result = await fetcher(targetPage);
        if (myRequest !== requestId.current) return; // a newer fetcher superseded us
        setTotalPages(result.pagination.totalPages);
        setPage(result.pagination.page);
        setItems((prev) =>
          targetPage === 1 ? result.items : [...prev, ...result.items],
        );
      } catch (e) {
        if (myRequest === requestId.current) {
          setError(e instanceof Error ? e.message : 'Something went wrong');
        }
      } finally {
        if (myRequest === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
        inFlight.current = false;
      }
    },
    [fetcher],
  );

  // Reset whenever the fetcher (i.e. the filter set) changes.
  useEffect(() => {
    setItems([]);
    setPage(1);
    void fetchPage(1, 'initial');
  }, [fetchPage]);

  const hasMore = page < totalPages;

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore || refreshing) return;
    void fetchPage(page + 1, 'more');
  }, [hasMore, loading, loadingMore, refreshing, page, fetchPage]);

  const refresh = useCallback(() => {
    void fetchPage(1, 'refresh');
  }, [fetchPage]);

  const reload = useCallback(() => {
    void fetchPage(1, 'initial');
  }, [fetchPage]);

  return { items, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, reload };
}
