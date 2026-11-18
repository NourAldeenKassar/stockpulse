import { Injectable, Logger } from '@nestjs/common';
import { RateLimiter } from '../common/rate-limiter.js';
import { parseTrading212Ticker } from './symbol.js';
import { namesMatch } from './company-name.js';
import type {
  AnalystConsensus,
  CompanyProfile,
  EarningsItem,
  Fundamentals,
  NewsItem,
  RecommendationTrend,
  StockMarketData,
  SymbolSearchResult,
} from './finnhub.types.js';

const BASE_URL = 'https://finnhub.io/api/v1';

// Finnhub's free tier allows 60 calls per minute, keyed per API key.
const RATE_LIMIT = { maxCalls: 55, windowMs: 60_000 };

// Fundamentals, news and ratings move slowly. Re-opening a holding should not
// spend six more calls against a 60/min budget.
const CACHE_TTL_MS = 15 * 60_000;

const NEWS_WINDOW_DAYS = 30;
const MAX_NEWS_ITEMS = 6;

function day(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

@Injectable()
export class FinnhubService {
  private readonly logger = new Logger(FinnhubService.name);
  private readonly limiter = new RateLimiter();
  private readonly symbolCache = new Map<string, string | null>();
  private readonly marketCache = new Map<
    string,
    { at: number; data: StockMarketData }
  >();

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

  private async getFundamentals(
    apiKey: string,
    symbol: string,
  ): Promise<Fundamentals | null> {
    const res = await this.request<{ metric?: Record<string, unknown> }>(
      apiKey,
      '/stock/metric',
      { symbol, metric: 'all' },
    );
    const m = res?.metric;
    if (!m) return null;

    const f: Fundamentals = {
      peRatio: num(m['peTTM']) ?? num(m['peBasicExclExtraTTM']),
      pbRatio: num(m['pbQuarterly']) ?? num(m['pbAnnual']),
      beta: num(m['beta']),
      dividendYield: num(m['dividendYieldIndicatedAnnual']),
      week52High: num(m['52WeekHigh']),
      week52Low: num(m['52WeekLow']),
      grossMargin: num(m['grossMarginTTM']),
      netMargin: num(m['netProfitMarginTTM']),
      returnOnEquity: num(m['roeTTM']),
      marketCap: num(m['marketCapitalization']),
    };

    // Every field empty means no usable coverage; show nothing rather than a
    // card full of dashes.
    return Object.values(f).some((v) => v !== null) ? f : null;
  }

  private async getNews(apiKey: string, symbol: string): Promise<NewsItem[]> {
    const items = await this.request<
      Array<{
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
      }>
    >(apiKey, '/company-news', {
      symbol,
      from: day(-NEWS_WINDOW_DAYS),
      to: day(),
    });

    if (!Array.isArray(items)) return [];

    return items
      .filter((n) => n.headline && n.url)
      .slice(0, MAX_NEWS_ITEMS)
      .map((n) => ({
        headline: n.headline!,
        summary: n.summary ?? '',
        source: n.source ?? '',
        url: n.url!,
        datetime: n.datetime
          ? new Date(n.datetime * 1000).toISOString()
          : new Date().toISOString(),
      }));
  }

  private async getEarnings(
    apiKey: string,
    symbol: string,
  ): Promise<EarningsItem[]> {
    const items = await this.request<
      Array<{
        period?: string;
        actual?: number;
        estimate?: number;
        surprisePercent?: number;
      }>
    >(apiKey, '/stock/earnings', { symbol });

    if (!Array.isArray(items)) return [];

    return items.slice(0, 4).map((e) => ({
      period: e.period ?? '',
      actual: num(e.actual),
      estimate: num(e.estimate),
      surprisePercent: num(e.surprisePercent),
    }));
  }

  private async getPeers(apiKey: string, symbol: string): Promise<string[]> {
    const peers = await this.request<string[]>(apiKey, '/stock/peers', {
      symbol,
    });
    if (!Array.isArray(peers)) return [];
    return peers.filter((p) => p && p !== symbol).slice(0, 8);
  }

  /**
   * Everything free we can show for a holding, fetched in parallel. Each part
   * fails independently: a premium-gated or uncovered endpoint yields null or
   * an empty list rather than sinking the whole panel.
   */
  async getMarketData(
    apiKey: string,
    ticker: string,
    isin: string | null,
  ): Promise<StockMarketData> {
    const cacheKey = `${ticker}:${isin ?? ''}`;
    const cached = this.marketCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

    const symbol = await this.resolveSymbol(apiKey, ticker, isin);

    if (!symbol) {
      const empty: StockMarketData = {
        symbol: null,
        consensus: null,
        fundamentals: null,
        news: [],
        earnings: [],
        peers: [],
        fetchedAt: new Date().toISOString(),
      };
      this.marketCache.set(cacheKey, { at: Date.now(), data: empty });
      return empty;
    }

    const [consensus, fundamentals, news, earnings, peers] = await Promise.all([
      this.getConsensus(apiKey, ticker, isin),
      this.getFundamentals(apiKey, symbol),
      this.getNews(apiKey, symbol),
      this.getEarnings(apiKey, symbol),
      this.getPeers(apiKey, symbol),
    ]);

    const data: StockMarketData = {
      symbol,
      consensus,
      fundamentals,
      news,
      earnings,
      peers,
      fetchedAt: new Date().toISOString(),
    };

    this.marketCache.set(cacheKey, { at: Date.now(), data });
    return data;
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
