import { request } from '../http';
import type { Insight } from '../types';

export function getInsights(accountId: string): Promise<Insight[]> {
  return request(`/accounts/${accountId}/insights`);
}

export function generateInsights(accountId: string): Promise<Insight[]> {
  return request(`/accounts/${accountId}/insights/generate`, {
    method: 'POST',
  });
}
