import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * useState backed by AsyncStorage. Values are JSON-serialized. `hydrated` flips true
 * once the persisted value has loaded, so callers can avoid flashing the default.
 */
export function useAsyncStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (active && raw != null) setValue(JSON.parse(raw) as T);
      })
      .catch(() => {
        /* corrupt value — keep the default */
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(() => undefined);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated];
}
