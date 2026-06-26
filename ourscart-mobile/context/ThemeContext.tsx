import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors, type ColorTokens } from '../constants/colors';

type ThemePreference = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'focuskit_theme';

interface ThemeContextValue {
  colors: ColorTokens;
  isDark: boolean;
  /** The user's explicit choice, or 'system' when following the OS. */
  preference: ThemePreference;
  toggleTheme: () => void;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Restore the saved override on first launch; absence means "follow system".
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setPreferenceState(saved);
      }
    });

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener((preferences) => {
      setSystemScheme(preferences.colorScheme);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const persist = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    if (pref === 'system') {
      AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      AsyncStorage.setItem(STORAGE_KEY, pref);
    }
  }, []);

  const isDark =
    preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  const toggleTheme = useCallback(() => {
    persist(isDark ? 'light' : 'dark');
  }, [isDark, persist]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? DarkColors : LightColors,
      isDark,
      preference,
      toggleTheme,
      setPreference: persist,
    }),
    [isDark, preference, toggleTheme, persist]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
