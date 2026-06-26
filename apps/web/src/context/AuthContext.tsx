'use client';
import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { getGuestSessionId, clearGuestSessionId } from '@/lib/session';
import type { User } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

type Action =
  | { type: 'SET_USER'; user: User }
  | { type: 'CLEAR' }
  | { type: 'SET_ANONYMOUS' };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { user: action.user, status: 'authenticated' };
    case 'CLEAR':
    case 'SET_ANONYMOUS':
      return { user: null, status: 'anonymous' };
    default:
      return state;
  }
}

interface AuthValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { user: null, status: 'loading' });

  // Hydrate from the session cookie on first load.
  useEffect(() => {
    api
      .get<{ user: User }>('/auth/me', { skipRefresh: false })
      .then((res) => dispatch({ type: 'SET_USER', user: res.user }))
      .catch(() => dispatch({ type: 'SET_ANONYMOUS' }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Pass the guest session so the server merges the guest cart on login.
    const res = await api.post<{ user: User }>(
      '/auth/login',
      { email, password, guestSessionId: getGuestSessionId() },
      { skipRefresh: true },
    );
    // Guest cart is now merged on the server; clear the local session id so a
    // subsequent logout → login cycle starts with a fresh (empty) guest context.
    clearGuestSessionId();
    dispatch({ type: 'SET_USER', user: res.user });
    return res.user;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; firstName: string; lastName: string }) => {
      const res = await api.post<{ user: User }>(
        '/auth/register',
        { ...input, guestSessionId: getGuestSessionId() },
        { skipRefresh: true },
      );
      // Same merge + clear as login. The new user now owns the cart items.
      clearGuestSessionId();
      dispatch({ type: 'SET_USER', user: res.user });
      return res.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout', undefined, { skipRefresh: true }).catch(() => undefined);
    dispatch({ type: 'CLEAR' });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      dispatch({ type: 'SET_USER', user: res.user });
    } catch {
      dispatch({ type: 'SET_ANONYMOUS' });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
