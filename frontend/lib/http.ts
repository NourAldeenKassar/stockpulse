import { createLocalStore } from './local-store';
import type { AuthTokens } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Exported so the auth provider can subscribe: tokens change on login and
 * logout, and anything deriving the current user has to see that.
 */
export const accessTokenStore = createLocalStore('accessToken');
const refreshTokenStore = createLocalStore('refreshToken');

function getTokens(): { access: string | null; refresh: string | null } {
  return {
    access: accessTokenStore.getSnapshot(),
    refresh: refreshTokenStore.getSnapshot(),
  };
}

export function setTokens(tokens: AuthTokens) {
  accessTokenStore.set(tokens.accessToken);
  refreshTokenStore.set(tokens.refreshToken);
}

export function clearTokens() {
  accessTokenStore.clear();
  refreshTokenStore.clear();
}

export function getAccessToken(): string | null {
  return getTokens().access;
}

let refreshPromise: Promise<string | null> | null = null;

/** Concurrent 401s share one refresh rather than racing several. */
async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refresh } = getTokens();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const tokens = (await res.json()) as AuthTokens;
      setTokens(tokens);
      return tokens.accessToken;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const { access } = getTokens();
  if (access) headers['Authorization'] = `Bearer ${access}`;

  let res = await fetch(`${API}${path}`, { headers, ...options });

  if (res.status === 401 && access) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`;
      res = await fetch(`${API}${path}`, { headers, ...options });
    }
  }

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    // Nest's ValidationPipe reports field errors as an array.
    const message = Array.isArray(error.message)
      ? error.message.join('. ')
      : error.message;
    throw new Error(message || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
