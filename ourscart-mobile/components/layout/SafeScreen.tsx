import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';
import { Header } from './Header';

interface SafeScreenProps {
  children: React.ReactNode;
  /** Which edges to pad. Defaults to top only — tab bar handles the bottom. */
  edges?: Edge[];
  /** Override the background (defaults to bgPrimary). */
  background?: string;
  style?: ViewStyle;
}

export function SafeScreen({
  children,
  edges = ['top'],
  background,
  style,
}: SafeScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const hasHeader = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === Header ||
        (child.type as any)?.name === 'Header' ||
        (child.type as any)?.displayName === 'Header')
  );

  const padding: ViewStyle = {
    paddingTop: edges.includes('top') && !hasHeader ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View
      style={[
        styles.fill,
        { backgroundColor: background ?? colors.bgPrimary },
        padding,
        style,
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
