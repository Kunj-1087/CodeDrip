import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { Toast } from '../components/ui/Toast';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

import { initializeMonitoring } from '../lib/monitoring';
import { validateAppEnvironment } from '../utils/env-check';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useScreenPerformance } from '../hooks/useScreenPerformance';

// Run these before anything else renders:
// 1. Environment validation — fail loudly if config is wrong.
// 2. Sentry initialization — capture crashes from the very first frame.
try {
  validateAppEnvironment();
} catch (e) {
  console.error('[Startup] Environment validation failed:', e);
}
initializeMonitoring();

// Hold the native splash until fonts resolve so we never flash unstyled (system-font) text.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const router = useRouter();
  useScreenPerformance('RootLayout');
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono_400Regular,
  });

  // Check for OTA updates on app start.
  useAppUpdate();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      try {
        const parsed = Linking.parse(event.url);
        const path = parsed.path;
        if (!path) return;

        if (path.startsWith('product/') || path.startsWith('shop/')) {
          const parts = path.split('/');
          const slug = parts[1];
          if (slug) {
            router.push(`/product/${slug}`);
          }
        } else if (path === 'shop') {
          router.push('/(tabs)/shop');
        } else if (path === 'cart') {
          router.push('/(tabs)/cart');
        } else if (path.startsWith('orders/')) {
          const parts = path.split('/');
          const id = parts[1];
          if (id) {
            router.push(`/orders/${id}`);
          }
        }
      } catch {
        // Deep link handling errors are non-critical.
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, [router]);

  const onLayout = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <BottomSheetModalProvider>
                      <View style={{ flex: 1 }}>
                        <Stack
                          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
                        >
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                          <Stack.Screen name="product/[slug]" />
                          <Stack.Screen
                            name="search"
                            options={{ animation: 'fade', presentation: 'modal' }}
                          />
                          <Stack.Screen name="checkout" />
                          <Stack.Screen name="orders" />
                          <Stack.Screen name="admin" />
                        </Stack>
                        {/* Offline banner appears at the top of every screen. */}
                        <OfflineBanner />
                        {/* Global toast viewport floats above all routes. */}
                        <Toast />
                      </View>
                    </BottomSheetModalProvider>
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
