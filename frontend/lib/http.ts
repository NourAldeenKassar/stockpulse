import type { AuthTokens } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

function getTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  try {
    return {
      access: localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
    };
  } catch {
    return { access: null, refresh: null };
  }
}

export function setTokens(tokens: AuthTokens) {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    // Storage can be unavailable in private browsing; the session simply
    // will not survive a reload.
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // nothing to clear
  }
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
