'use client';
import { useCallback, useEffect, useState } from 'react';

// Stateful value persisted to localStorage, SSR-safe (reads only after mount so
// server and first client render agree).
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      /* ignore malformed storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage may be unavailable (private mode) */
      }
    },
    [key],
  );

  return [value, update] as const;
}
