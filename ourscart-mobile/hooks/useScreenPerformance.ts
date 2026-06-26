// =============================================================================
// Screen performance monitoring. Tracks mount-to-interactive time for every
// screen and flags slow loads (>3s) via Sentry. Screens taking too long degrade
// the user experience on budget Android devices and need optimization attention.
// =============================================================================
import { useEffect, useRef } from 'react';
import { captureMessage } from '../lib/monitoring';

/**
 * Call at the top of every screen component:
 *   useScreenPerformance('ShopScreen');
 *
 * Reports the mount-to-first-render time. In development, it logs to console.
 * In production, screens taking >3s are flagged in Sentry for investigation.
 */
export function useScreenPerformance(screenName: string): void {
  const mountTime = useRef(Date.now());
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;

    const loadTime = Date.now() - mountTime.current;
    reported.current = true;

    if (loadTime > 3000) {
      // Screen took more than 3 seconds — flag for investigation in production.
      captureMessage(`Slow screen load: ${screenName} took ${loadTime}ms`, 'warning');
    }

    if (__DEV__) {
      const label = loadTime > 1000 ? '🐢' : '⚡';
      console.log(`[Perf] ${label} ${screenName} loaded in ${loadTime}ms`);
    }
  }, [screenName]);
}
