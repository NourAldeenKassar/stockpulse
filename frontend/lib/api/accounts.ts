import { request } from '../http';
import type { AccountSummary, Position, TradingAccount } from '../types';

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
