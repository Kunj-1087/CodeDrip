import React, { useRef, useState } from 'react';
import {
  Animated,
  TextInput,
  Text,
  View,
  Pressable,
  StyleSheet,
  type KeyboardTypeOptions,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { sanitizeText } from '../../utils/sanitize';
import { FontFamily, FontSize, lh } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  autoFocus?: boolean;
  style?: TextStyle;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helper,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  multiline,
  numberOfLines,
  editable = true,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  autoFocus,
  style,
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const glow = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.timing(glow, { toValue: to, duration: 150, useNativeDriver: false }).start();

  const borderColor = error
    ? colors.accentRed
    : focused
      ? colors.brandPrimary
      : colors.borderDefault;

  // Background shifts from bgPrimary to brandPrimaryLight on focus
  const backgroundColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgPrimary, colors.brandPrimaryLight],
  });

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}

      <Animated.View
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: error ? colors.bgPrimary : backgroundColor,
            alignItems: multiline ? 'flex-start' : 'center',
            minHeight: multiline ? 96 : 44,
          },
        ]}
      >
        {leftIcon ? <View style={styles.adornment}>{leftIcon}</View> : null}

        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(sanitizeText(text, maxLength ?? 255))}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          autoFocus={autoFocus}
          onFocus={() => {
            setFocused(true);
            animate(1);
          }}
          onBlur={() => {
            setFocused(false);
            animate(0);
          }}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              textAlignVertical: multiline ? 'top' : 'center',
            } as TextStyle,
            style,
          ]}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.adornment}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.adornment}>{rightIcon}</View>
        ) : null}
      </Animated.View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.accentRed }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    marginBottom: Space[2],
  },
  field: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space[4],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: lh(FontSize.base),
    paddingVertical: Space[3],
  },
  adornment: { paddingHorizontal: Space[1], justifyContent: 'center' },
  helper: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: Space[1] },
  errorText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, marginTop: Space[1] },
});
