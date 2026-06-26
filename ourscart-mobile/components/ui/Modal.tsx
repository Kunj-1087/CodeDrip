import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Bottom-sheet style (slides up, pinned to the bottom) vs centered card. */
  position?: 'center' | 'bottom';
  contentStyle?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  position = 'center',
  contentStyle,
}: ModalProps) {
  const { colors } = useTheme();
  const isBottom = position === 'bottom';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={isBottom ? 'slide' : 'fade'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Tapping the scrim dismisses; the inner Pressable stops that bubbling up. */}
      <Pressable
        style={[styles.scrim, isBottom ? styles.scrimBottom : styles.scrimCenter]}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: colors.bgPrimary,
              borderColor: colors.borderSubtle,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              borderBottomLeftRadius: isBottom ? 0 : Radius.xl,
              borderBottomRightRadius: isBottom ? 0 : Radius.xl,
              width: isBottom ? '100%' : '88%',
            },
            contentStyle,
          ]}
        >
          {isBottom ? (
            <View style={[styles.grabber, { backgroundColor: colors.borderDefault }]} />
          ) : null}

          {title ? (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}

          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scrimCenter: { alignItems: 'center', justifyContent: 'center', padding: Space[5] },
  scrimBottom: { justifyContent: 'flex-end' },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: Space[5],
    maxHeight: '85%',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Space[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space[4],
  },
  title: { fontFamily: FontFamily.semibold, fontSize: FontSize.xl },
});
