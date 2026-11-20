import { request } from '../http';
import type { Snapshot } from '../types';

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
