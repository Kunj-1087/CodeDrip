// =============================================================================
// In-memory response cache for frequently read, rarely changed data (store
// settings, categories, featured products, product details).
//
// Production: swap Map for Redis using the same interface (get/set/delete keys
// prefixed with "cache:") to share cache across multiple API instances.
//
// Cache entries expire after a configurable TTL. The cache is bounded at 1,000
// entries — when exceeded, the oldest entry is evicted. This prevents memory
// leaks from unusual traffic patterns or cache-key enumeration attacks.
// =============================================================================
import type { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const MAX_SIZE = 1000;

/**
 * Express middleware that caches successful (200) GET responses.
 * @param ttlSeconds — how long the response stays fresh.
 */
export function cacheMiddleware(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;
    const cached = store.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.json(cached.data);
    }

    // Override res.json to capture the response body for caching.
    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (res.statusCode === 200) {
        // Evict oldest entry if at capacity.
        if (store.size >= MAX_SIZE) {
          const firstKey = store.keys().next().value;
          if (firstKey) store.delete(firstKey);
        }
        store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate all cache entries whose key contains `pattern`.
 * Call this after any write operation that would stale cached data, e.g.
 * admin product updates clear the '/products' prefix.
 */
export function invalidateCache(pattern: string): void {
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key);
  }
}
