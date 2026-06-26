import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Space } from '../../constants/spacing';

interface HeaderProps {
  title?: string;
  /** Show a back chevron. Defaults to true; auto-falls back to popping the stack. */
  showBack?: boolean;
  onBack?: () => void;
  /** Optional right-aligned slot (icon button, cart badge, etc.). */
  right?: React.ReactNode;
  /** Optional left slot replacing the back button (e.g. a Logo). */
  left?: React.ReactNode;
  borderless?: boolean;
}

export function Header({
  title,
  showBack = true,
  onBack,
  right,
  left,
  borderless = false,
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgPrimary,
          borderBottomColor: borderless ? colors.transparent : colors.borderSubtle,
          borderBottomWidth: borderless ? 0 : 1,
          paddingTop: insets.top,
          height: 56 + insets.top,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftZone}>
          {left ?? (
            showBack ? (
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backTouchTarget}
              >
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              </Pressable>
            ) : null
          )}
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightZone}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  contentRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space[4],
  },
  leftZone: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightZone: {
    width: 88, // allows up to 2 action icons with spacing
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backTouchTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
  },
});
