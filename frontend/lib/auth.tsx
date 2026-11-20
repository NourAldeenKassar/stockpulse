'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from './types';
import { accessTokenStore, clearTokens, setTokens } from './http';
import { useHydrated } from './use-hydrated';
import * as api from './api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwt(
  token: string,
): { sub: string; email: string; exp: number } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as {
      sub: string;
      email: string;
      exp: number;
    };
  } catch {
    return null;
  }
}

function userFromToken(token: string | null): User | null {
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload) return null;
  if (payload.exp * 1000 < Date.now()) return null;

  return { id: payload.sub, email: payload.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(
    accessTokenStore.subscribe,
    accessTokenStore.getSnapshot,
    accessTokenStore.getServerSnapshot,
  );

  // The server has no token, so the first client render must match it.
  // isLoading is really "not hydrated yet".
  const hydrated = useHydrated();

  const user = useMemo(() => userFromToken(token), [token]);

  const login = useCallback(async (email: string, password: string) => {
    setTokens(await api.login(email, password));
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setTokens(await api.register(email, password));
  }, []);

  const logout = useCallback(() => {
    clearTokens();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading: !hydrated, login, register, logout }),
    [user, hydrated, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
