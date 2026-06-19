'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const STORAGE_KEY = 'ourscart_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // On mount, honor a saved choice, else the OS preference.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
  }, []);

  // Reflect theme onto <html> for the Tailwind `dark:` variant + CSS vars.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
