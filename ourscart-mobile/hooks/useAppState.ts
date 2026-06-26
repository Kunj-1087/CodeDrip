// =============================================================================
// App state handler — checks token freshness when the app returns to foreground.
//
// When a user backgrounds the app for an extended period, the access token may
// expire. This hook triggers a refresh callback so AuthContext can proactively
// refresh the token before the next API call fails with 401.
// =============================================================================
import { AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';

/**
 * Calls `onRefreshNeeded` when the app transitions from background/inactive to
 * active — but only if the stored access token has expired. This prevents a
 * stale 401 from showing a login screen after the user just unlocks their phone.
 */
export function useAppStateRefresh(onRefreshNeeded: () => void): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isNowActive = nextState === 'active';

      if (wasBackground && isNowActive) {
        // App came to foreground — trigger token freshness check.
        onRefreshNeeded();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [onRefreshNeeded]);
}
