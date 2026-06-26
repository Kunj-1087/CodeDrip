import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

// A NamedStyles-shaped factory: receives the active palette, returns a style map.
type StyleFactory<T> = (colors: ColorTokens) => T;

/**
 * Builds a hook that produces a theme-aware StyleSheet. Defining styles outside the
 * component keeps the factory referentially stable, and the returned hook memoizes
 * per-palette so we only rebuild the sheet when light/dark actually flips.
 *
 *   const useStyles = createThemedStyles((colors) => ({
 *     container: { backgroundColor: colors.bgPrimary },
 *   }));
 *   // inside a component:
 *   const { styles, colors } = useStyles();
 */
export function createThemedStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<unknown>,
>(factory: StyleFactory<T>) {
  return function useThemedStyles() {
    const { colors, isDark } = useTheme();
    // isDark is part of the dep list because both palettes share keys but differ in
    // value — keying on the object identity alone is enough, isDark just documents it.
    const styles = useMemo(() => StyleSheet.create(factory(colors)), [colors, isDark]);
    return { styles, colors, isDark };
  };
}
