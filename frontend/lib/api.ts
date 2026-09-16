import type {
  AuthTokens,
  TradingAccount,
  AccountSummary,
  Position,
  Snapshot,
} from './types';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

function getTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  };
}

function setTokens(tokens: AuthTokens) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const { access } = getTokens();
  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  let res = await fetch(`${API}${path}`, { headers, ...options });

  if (res.status === 401 && access) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`;
      res = await fetch(`${API}${path}`, { headers, ...options });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

let refreshPromise: Promise<string | null> | null = null;

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

      const tokens: AuthTokens = await res.json();
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

export function register(email: string, password: string): Promise<AuthTokens> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<AuthTokens> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function connectAccount(
  apiKey: string,
  apiSecret: string,
  label?: string,
): Promise<TradingAccount> {
  return request('/accounts', {
    method: 'POST',
    body: JSON.stringify({ apiKey, apiSecret, label }),
  });
}

export function listAccounts(): Promise<TradingAccount[]> {
  return request('/accounts');
}

export function updateAccount(
  id: string,
  data: { label?: string; snapshotIntervalMin?: number },
): Promise<TradingAccount> {
  return request(`/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function disconnectAccount(id: string): Promise<void> {
  return request(`/accounts/${id}`, { method: 'DELETE' });
}

export function getAccountSummary(accountId: string): Promise<AccountSummary> {
  return request(`/accounts/${accountId}/summary`);
}

export function getAccountPositions(accountId: string): Promise<Position[]> {
  return request(`/accounts/${accountId}/positions`);
}

export function getSnapshots(
  accountId: string,
  from?: string,
  to?: string,
): Promise<Snapshot[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/accounts/${accountId}/snapshots${query}`);
}

export function getLatestSnapshot(accountId: string): Promise<Snapshot | null> {
  return request(`/accounts/${accountId}/snapshots/latest`);
}

export function triggerSnapshot(accountId: string): Promise<{ ok: boolean }> {
  return request(`/accounts/${accountId}/snapshots`, { method: 'POST' });
}

export interface LlmSettings {
  llmGatewayUrl: string;
  hasLlmKey: boolean;
}

export function getLlmSettings(): Promise<LlmSettings> {
  return request('/user/llm-settings');
}

export function updateLlmSettings(data: {
  llmGatewayUrl?: string;
  llmGatewayKey?: string;
}): Promise<LlmSettings> {
  return request('/user/llm-settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface Insight {
  title: string;
  body: string;
  type: 'warning' | 'info' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
}

export function getInsights(accountId: string): Promise<Insight[]> {
  return request(`/accounts/${accountId}/insights`);
}

export function generateInsights(accountId: string): Promise<Insight[]> {
  return request(`/accounts/${accountId}/insights/generate`, {
    method: 'POST',
  });
}

export { setTokens };
