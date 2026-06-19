// Server-side fetch helper for React Server Components. Hits public API
// endpoints with no caching (catalog/pricing should always be fresh). Returns
// null on failure so pages can render a graceful fallback instead of crashing.
import { API_URL } from './api';

export async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
