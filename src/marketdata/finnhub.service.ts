import { Injectable, Logger } from '@nestjs/common';
import { RateLimiter } from '../common/rate-limiter.js';
import { parseTrading212Ticker } from './symbol.js';
import { namesMatch } from './company-name.js';
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
      const hit =
        search?.result?.find((r) => r.type === 'Common Stock') ??
        search?.result?.[0];

      if (hit?.symbol) {
        const base = await this.unsuffixedIfSameCompany(
          apiKey,
          hit.symbol,
          hit.description,
        );
        return base ?? hit.symbol;
      }
    }

    this.logger.log(
      `No confident symbol for ${ticker}; consensus will be omitted`,
    );
    return null;
  }

  /**
   * An ISIN search for a European listing returns a venue-suffixed symbol such
   * as ASML.AS or SAP.DE, and those are premium-gated: the free tier answers
   * 403 and the holding would show no analyst data at all. The unsuffixed
   * symbol usually is available, and analyst coverage is a property of the
   * company rather than the venue, so it is the right data to show.
   *
   * The danger is that a base symbol can belong to an entirely different
   * company, which would attach the wrong ratings to the position. So the base
   * is only used when its registered company name matches the one the ISIN
   * resolved to. Returns null when it cannot be confirmed.
   */
  private async unsuffixedIfSameCompany(
    apiKey: string,
    symbol: string,
    expectedName: string,
  ): Promise<string | null> {
    const dot = symbol.indexOf('.');
    if (dot <= 0) return null;

    const base = symbol.slice(0, dot);
    const profile = await this.request<CompanyProfile>(
      apiKey,
      '/stock/profile2',
      { symbol: base },
    );

    if (!profile?.name || !expectedName) return null;
    if (!namesMatch(profile.name, expectedName)) {
      this.logger.log(
        `Base symbol ${base} is ${profile.name}, not ${expectedName}; not borrowing its coverage`,
      );
      return null;
    }

    return base;
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
