import { request } from '../http';
import type { StockAnalysis, StockMarketData } from '../types';

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

/** Free analyst data, fundamentals, news, earnings and peers. No LLM call. */
export function getStockMarketData(
  accountId: string,
  ticker: string,
  isin?: string | null,
): Promise<StockMarketData | null> {
  const query = isin ? `?isin=${encodeURIComponent(isin)}` : '';
  return request(
    `/accounts/${accountId}/stocks/${encodeURIComponent(ticker)}/market-data${query}`,
  );
}
