import React, { useEffect, useRef } from 'react';
import { Animated, Text, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast, type ToastMessage, type ToastVariant } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import type { ColorTokens } from '../../constants/colors';
import { FontFamily, FontSize, lh } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

const ICONS: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle-outline',
  error: 'alert-circle-outline',
  warning: 'warning-outline',
  info: 'information-circle-outline',
};

function accentFor(variant: ToastVariant, colors: ColorTokens): string {
  switch (variant) {
    case 'success':
      return colors.accentGreen;
    case 'error':
      return colors.accentRed;
    case 'warning':
      return colors.accentAmber;
    default:
      return colors.brandPrimary;
  }
}

function ToastRow({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const accent = accentFor(toast.variant, colors);

  useEffect(() => {
    // Spring slide animation
    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Shrinking progress animation
    Animated.timing(progress, {
      toValue: 0,
      duration: 4000,
      useNativeDriver: false,
    }).start();
  }, [translateY, progress]);

  const heightVal = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Pressable
        onPress={onDismiss}
        style={[
          styles.toast,
          Shadows.lg,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        {/* Shrinking left accent border (3dp solid) */}
        <View style={styles.stripeContainer}>
          <Animated.View style={[styles.stripe, { backgroundColor: accent, height: heightVal }]} />
        </View>

        <View style={styles.content}>
          <Ionicons name={ICONS[toast.variant]} size={20} color={accent} style={styles.icon} />
          <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={3}>
            {toast.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function Toast() {
  const { toasts, dismiss } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.viewport, { top: insets.top + 16 }]}>
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    gap: Space[2],
  },
  toast: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 52,
  },
  stripeContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'transparent',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Space[3],
    paddingLeft: Space[4] + 4, // padding plus stripe offset
    paddingRight: Space[4],
    flex: 1,
  },
  icon: {
    marginRight: Space[3],
  },
  message: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm),
  },
});
