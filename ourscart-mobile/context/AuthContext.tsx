import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { apiGet, apiPost, setUnauthorizedHandler, getSessionId } from '../lib/api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUserId,
  getStoredUserRole,
  isTokenExpired,
  saveTokens,
} from '../lib/auth';
import { setMonitoringUser, clearMonitoringUser, captureError } from '../lib/monitoring';
import { useAppStateRefresh } from '../hooks/useAppState';
import type { User } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

interface AuthContextValue {
  user: User | null;
  /** True while the initial session-restore is running (show a splash/skeleton). */
  initializing: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshTokensIfNeeded: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { user: me } = await apiGet<{ user: User }>('/auth/me');
      setUser(me);
      setMonitoringUser({ id: me.id, email: me.email });
    } catch {
      // Silently fail — caller handles the error.
    }
  }, []);

  // Refresh tokens proactively when app returns to foreground.
  const refreshTokensIfNeeded = useCallback(async () => {
    const token = await getAccessToken();
    if (token && (await isTokenExpired(token))) {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { Cookie: `refreshToken=${refreshToken}` },
        });
        if (!response.ok) throw new Error('Refresh failed');
        const { accessToken, refreshToken: newRefreshToken, user: me } = await response.json();
        if (accessToken && newRefreshToken && me) {
          await saveTokens(accessToken, newRefreshToken, me.id, me.role);
          setUser(me);
        }
      } catch {
        // Refresh failed — user will hit 401 on next API call and be redirected.
      }
    }
  }, []);

  useAppStateRefresh(refreshTokensIfNeeded);

  // Restore session on launch — resilient to partial data loss or corruption.
  const initializeAuth = useCallback(async () => {
    try {
      const [accessToken, refreshToken, userId, userRole] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
        getStoredUserId(),
        getStoredUserRole(),
      ]);

      if (!accessToken || !refreshToken || !userId) {
        // No stored session — show logged-out state.
        setUser(null);
        return;
      }

      if (await isTokenExpired(accessToken)) {
        // Access token expired — try to refresh before showing UI.
        try {
          const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) throw new Error('Refresh failed');

          const data = await response.json();
          const { user: me } = data;
          await saveTokens(
            data.accessToken || accessToken,
            data.refreshToken || refreshToken,
            me.id,
            me.role,
          );
          setUser(me);
          setMonitoringUser({ id: me.id, email: me.email });
        } catch {
          // Refresh failed — clear everything and show login.
          await clearTokens();
          setUser(null);
        }
      } else {
        // Access token still valid — restore session without hitting the API.
        // Use stored user ID and role for the minimal user object.
        setUser({
          id: userId,
          role: (userRole as User['role']) || 'customer',
        } as User);

        // Fetch full user profile in background — non-blocking.
        loadMe().catch(() => {});
      }
    } catch (error) {
      captureError(error, { context: 'auth_initialization' });
      await clearTokens().catch(() => {});
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, [loadMe]);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  // When the api client gives up on refresh, drop our user state so route guards
  // bounce to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      clearMonitoringUser();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const guestSessionId = await getSessionId();
    const { user: me } = await apiPost<{ user: User }>('/auth/login', {
      email,
      password,
      guestSessionId,
    });
    setUser(me);
    setMonitoringUser({ id: me.id, email: me.email });
  }, []);

  const register = useCallback(
    async (input: { firstName: string; lastName: string; email: string; password: string }) => {
      const guestSessionId = await getSessionId();
      const { user: me } = await apiPost<{ user: User }>('/auth/register', {
        ...input,
        guestSessionId,
      });
      setUser(me);
      setMonitoringUser({ id: me.id, email: me.email });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      /* best-effort; we clear local state regardless */
    }
    await clearTokens();
    clearMonitoringUser();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiPost('/auth/forgot-password', { email });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      forgotPassword,
      refreshUser: loadMe,
      refreshTokensIfNeeded,
    }),
    [user, initializing, login, register, logout, forgotPassword, loadMe, refreshTokensIfNeeded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
