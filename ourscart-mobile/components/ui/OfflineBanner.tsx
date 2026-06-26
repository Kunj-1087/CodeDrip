// =============================================================================
// Offline banner — shows a red "No internet connection" bar at the top of the
// screen when the device loses connectivity. Animates in/out with a spring
// transition so it's informative but not jarring.
// =============================================================================
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useNetworkState } from '../../hooks/useNetworkState';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useRef } from 'react';
import { FontSize, FontFamily } from '../../constants/typography';
import { Space } from '../../constants/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkState();
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-60)).current;
  const isOffline = !isConnected || !isInternetReachable;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  // Don't render anything if we're online — avoids blocking touches.
  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.accentRed || '#DC2626',
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="wifi-outline" size={16} color="#FFFFFF" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space[2],
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
});
