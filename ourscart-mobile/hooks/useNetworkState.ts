// =============================================================================
// Network state detection. Uses expo-network to monitor connectivity and detects
// slow connections (2G/3G) so the UI can adapt — e.g., show lower-resolution
// images or skip pre-fetching on slow networks.
//
// Polls every 3 seconds because expo-network doesn't have a reliable change
// listener on Android. This is a lightweight operation (reads cached radio state).
// =============================================================================
import * as Network from 'expo-network';
import { useState, useEffect } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isSlowConnection: boolean; // True for 2G/3G — adapt UI accordingly.
}

export function useNetworkState(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isSlowConnection: false,
  });

  useEffect(() => {
    let cancelled = false;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (cancelled) return;

        // Determine if the connection is slow (2G/3G in India).
        const isCellular = state.type === Network.NetworkStateType.CELLULAR;
        // Treat 2G and 3G as slow. expo-network doesn't expose generation
        // details directly on Android, so we infer from the type.
        const isSlowConnection =
          isCellular &&
          (state.isInternetReachable === false ||
            (state as { details?: { cellularGeneration?: string } }).details
              ?.cellularGeneration === '2g' ||
            (state as { details?: { cellularGeneration?: string } }).details
              ?.cellularGeneration === '3g');

        setNetworkState({
          isConnected: state.isConnected ?? true,
          isInternetReachable: state.isInternetReachable ?? true,
          type: state.type ? String(state.type) : 'unknown',
          isSlowConnection,
        });
      } catch {
        // On error, assume connected to avoid false-positive offline banner.
        if (!cancelled) {
          setNetworkState((prev) => ({ ...prev, isConnected: true, isInternetReachable: true }));
        }
      }
    };

    checkNetwork();
    // Poll every 3 seconds — no reliable listener on Android.
    const interval = setInterval(checkNetwork, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return networkState;
}
