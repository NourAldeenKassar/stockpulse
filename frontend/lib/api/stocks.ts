import { request } from '../http';
import type { StockAnalysis } from '../types';

export function getStockAnalysis(
  accountId: string,
  ticker: string,
): Promise<StockAnalysis | null> {
  return request(
    `/accounts/${accountId}/stocks/${encodeURIComponent(ticker)}/analysis`,
  );
}

export function generateStockAnalysis(
  accountId: string,
  ticker: string,
): Promise<StockAnalysis> {
  return request(
    `/accounts/${accountId}/stocks/${encodeURIComponent(ticker)}/analysis`,
    { method: 'POST' },
  );
}
