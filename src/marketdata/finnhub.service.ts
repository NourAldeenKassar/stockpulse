import { Injectable, Logger } from '@nestjs/common';
import { RateLimiter } from '../common/rate-limiter.js';
import { parseTrading212Ticker } from './symbol.js';
import type {
  AnalystConsensus,
  CompanyProfile,
  RecommendationTrend,
  SymbolSearchResult,
} from './finnhub.types.js';

const BASE_URL = 'https://finnhub.io/api/v1';

// Finnhub's free tier allows 60 calls per minute, keyed per API key.
const RATE_LIMIT = { maxCalls: 55, windowMs: 60_000 };

@Injectable()
export class FinnhubService {
  private readonly logger = new Logger(FinnhubService.name);
  private readonly limiter = new RateLimiter();
  private readonly symbolCache = new Map<string, string | null>();

  private async request<T>(
    apiKey: string,
    path: string,
    params: Record<string, string>,
  ): Promise<T | null> {
    await this.limiter.acquire(apiKey.slice(0, 12), RATE_LIMIT);

    const query = new URLSearchParams({ ...params, token: apiKey });
    const res = await fetch(`${BASE_URL}${path}?${query.toString()}`);

    if (!res.ok) {
      this.logger.warn(`Finnhub ${res.status} on ${path}`);
      return null;
    }

    return (await res.json()) as T;
  }

  /**
   * Maps a Trading212 ticker onto a Finnhub symbol.
   *
   * US listings map directly. Everything else is confirmed against the ISIN,
   * because a bare base symbol does not identify a non-US listing and would
   * quietly return another company's ratings. Returns null when it cannot be
   * resolved, and the caller must then show no consensus at all.
   */
  async resolveSymbol(
    apiKey: string,
    ticker: string,
    isin: string | null,
  ): Promise<string | null> {
    const cacheKey = `${ticker}:${isin ?? ''}`;
    const cached = this.symbolCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const resolved = await this.lookupSymbol(apiKey, ticker, isin);
    this.symbolCache.set(cacheKey, resolved);
    return resolved;
  }

  private async lookupSymbol(
    apiKey: string,
    ticker: string,
    isin: string | null,
  ): Promise<string | null> {
    const candidate = parseTrading212Ticker(ticker);
    if (candidate?.confident) return candidate.symbol;

    if (isin) {
      const search = await this.request<SymbolSearchResult>(apiKey, '/search', {
        q: isin,
      });
      const hit = search?.result?.find((r) => r.type === 'Common Stock');
      if (hit?.symbol) return hit.symbol;
      if (search?.result?.[0]?.symbol) return search.result[0].symbol;
    }

    this.logger.log(
      `No confident symbol for ${ticker}; consensus will be omitted`,
    );
    return null;
  }

  async getConsensus(
    apiKey: string,
    ticker: string,
    isin: string | null,
  ): Promise<AnalystConsensus | null> {
    const symbol = await this.resolveSymbol(apiKey, ticker, isin);
    if (!symbol) return null;

    const [trends, profile] = await Promise.all([
      this.request<RecommendationTrend[]>(apiKey, '/stock/recommendation', {
        symbol,
      }),
      this.request<CompanyProfile>(apiKey, '/stock/profile2', { symbol }),
    ]);

    if (!trends || trends.length === 0) return null;

    return {
      symbol,
      // Finnhub returns newest first; keep the most recent six months.
      trends: trends.slice(0, 6),
      industry: profile?.finnhubIndustry || null,
      source: 'finnhub',
      fetchedAt: new Date().toISOString(),
    };
  }
}
