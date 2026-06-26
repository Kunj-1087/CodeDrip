import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../../context/ThemeContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Button } from '../../components/ui/Button';
import { FontFamily, FontSize, lh, LineHeight } from '../../constants/typography';
import { Space } from '../../constants/spacing';

/**
 * Self-contained success animation: a ripple ring expands behind a spring-scaled
 * checkmark, with a confetti burst. We avoid a Lottie JSON dependency so the screen
 * has no external asset to ship or fail to load.
 */
export default function OrderSuccessScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { orderNumber, orderId } = useLocalSearchParams<{ orderNumber?: string; orderId?: string }>();

  const scale = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
    ]).start();
    const loop = Animated.loop(
      Animated.timing(ripple, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, ripple]);

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.6] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <SafeScreen edges={['top', 'bottom']}>
      <ConfettiCannon
        count={120}
        origin={{ x: width / 2, y: -20 }}
        fadeOut
        autoStart
        explosionSpeed={350}
        fallSpeed={2800}
        colors={[colors.brandPrimary, colors.accentGreen, colors.accentAmber, colors.interactiveBlue]}
      />

      <View style={styles.container}>
        <View style={styles.badge}>
          <Animated.View
            style={[
              styles.ripple,
              { backgroundColor: colors.accentGreen, transform: [{ scale: rippleScale }], opacity: rippleOpacity },
            ]}
          />
          <Animated.View style={[styles.check, { backgroundColor: colors.accentGreen, transform: [{ scale }] }]}>
            <Ionicons name="checkmark" size={56} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Order Confirmed!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Thank you for your purchase. We&apos;ve emailed your receipt and will notify you when it ships.
        </Text>

        {orderNumber ? (
          <View style={[styles.orderChip, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.orderLabel, { color: colors.textMuted }]}>Order number</Text>
            <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>{orderNumber}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Track Order"
            fullWidth
            size="lg"
            onPress={() => router.replace(orderId ? `/orders/${orderId}` : '/orders')}
          />
          <Button label="Continue Shopping" variant="ghost" fullWidth onPress={() => router.replace('/(tabs)/home')} />
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space[8] },
  badge: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: Space[6] },
  ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  check: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['3xl'], textAlign: 'center' },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm, LineHeight.relaxed),
    textAlign: 'center',
    marginTop: Space[3],
  },
  orderChip: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: Space[3],
    paddingHorizontal: Space[6],
    marginTop: Space[6],
  },
  orderLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  orderNumber: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, marginTop: 2 },
  actions: { width: '100%', marginTop: Space[8], gap: Space[2] },
});
