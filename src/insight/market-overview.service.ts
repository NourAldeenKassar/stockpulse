import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../account/account.service.js';
import { Trading212Service } from '../trading212/trading212.service.js';
import { FinnhubService } from '../marketdata/finnhub.service.js';
import { UserService } from '../user/user.service.js';
import { TtlCache } from '../common/ttl-cache.js';
import type { EarningsItem, NewsItem } from '../marketdata/finnhub.types.js';

export interface ConsensusTally {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  total: number;
}

export interface HoldingOverview {
  ticker: string;
  name: string;
  symbol: string | null;
  value: number;
  weight: number;
  pplPercent: number;
  consensus: ConsensusTally | null;
  latestEarnings: EarningsItem | null;
  /** Currency the EPS figures are reported in, when known. */
  reportingCurrency: string | null;
}

export interface PortfolioNewsItem extends NewsItem {
  ticker: string;
  name: string;
}

export interface MarketOverview {
  holdings: HoldingOverview[];
  /** Analyst tally summed across covered holdings, weighted by position value. */
  sentiment: ConsensusTally | null;
  news: PortfolioNewsItem[];
  covered: number;
  total: number;
  fetchedAt: string;
}

const MAX_NEWS = 12;

/**
 * Ratings, fundamentals and news move slowly, and assembling this costs a few
 * dozen upstream calls. Cached so a reload is free rather than re-running the
 * whole fan-out, and so concurrent callers share one pass.
 */
const OVERVIEW_TTL_MS = 10 * 60_000;

/**
 * A build where some holding could not be resolved is probably a transient
 * upstream failure, usually rate limiting. Keeping it for the full term would
 * serve a portfolio with pieces missing for ten minutes, so it expires quickly
 * and heals itself on the next request.
 */
const INCOMPLETE_TTL_MS = 60_000;

@Injectable()
export class MarketOverviewService {
  private readonly logger = new Logger(MarketOverviewService.name);
  private readonly cache = new TtlCache();

  constructor(
    private accountService: AccountService,
    private trading212: Trading212Service,
    private finnhub: FinnhubService,
    private users: UserService,
  ) {}

  async getOverview(
    userId: string,
    accountId: string,
    forceRefresh = false,
  ): Promise<MarketOverview | null> {
    // Keyed by user as well as account: the credentials used to build this are
    // the caller's, so one user's result must never serve another's.
    const key = `${userId}:${accountId}`;
    if (forceRefresh) this.cache.invalidate(key);

    return this.cache.getOrLoad(key, OVERVIEW_TTL_MS, async () => {
      const overview = await this.buildOverview(
        userId,
        accountId,
        forceRefresh,
      );

      // A holding with an ISIN but no resolved symbol means the lookup failed,
      // not that the instrument has no coverage.
      const unresolved =
        overview?.holdings.filter((h) => !h.symbol).length ?? 0;
      if (unresolved > 0) {
        this.logger.warn(
          `${unresolved} holding(s) unresolved; caching briefly so it can heal`,
        );
        this.cache.expireSooner(key, INCOMPLETE_TTL_MS);
      }

      return overview;
    });
  }

  private async buildOverview(
    userId: string,
    accountId: string,
    forceRefresh = false,
  ): Promise<MarketOverview | null> {
    const finnhubKey = await this.users.decryptFinnhubKey(userId);
    if (!finnhubKey) return null;

    const { apiKey, apiSecret } = await this.accountService.decryptCredentials(
      userId,
      accountId,
    );
    const positions = await this.trading212.getPositions(apiKey, apiSecret);
    const portfolioValue = positions.reduce(
      (sum, p) => sum + p.walletImpact.currentValue,
      0,
    );

    const news: PortfolioNewsItem[] = [];

    // In parallel. Done sequentially each holding waits on several round trips
    // before the next begins, which costs over a minute for a handful of them.
    // The rate limiter still protects the budget: when a portfolio needs more
    // calls than the window allows, it queues them rather than dropping them.
    // Cleared once rather than per holding: the caches are shared, so clearing
    // inside the loop would discard work the parallel fetches just did.
    if (forceRefresh) this.finnhub.clearCaches();

    const holdings = await Promise.all(
      positions.map(async (p) => {
        const value = p.walletImpact.currentValue;
        const base: HoldingOverview = {
          ticker: p.instrument.ticker,
          name: p.instrument.name,
          symbol: null,
          value,
          weight: portfolioValue > 0 ? (value / portfolioValue) * 100 : 0,
          pplPercent:
            p.averagePricePaid > 0
              ? ((p.currentPrice - p.averagePricePaid) / p.averagePricePaid) *
                100
              : 0,
          consensus: null,
          latestEarnings: null,
          reportingCurrency: null,
        };

        try {
          const data = await this.finnhub.getMarketData(
            finnhubKey,
            p.instrument.ticker,
            p.instrument.isin || null,
          );

          base.symbol = data.symbol;
          base.latestEarnings = data.earnings[0] ?? null;
          base.reportingCurrency = data.fundamentals?.currency ?? null;

          const latest = data.consensus?.trends[0];
          if (latest) {
            base.consensus = {
              strongBuy: latest.strongBuy,
              buy: latest.buy,
              hold: latest.hold,
              sell: latest.sell,
              strongSell: latest.strongSell,
              total:
                latest.strongBuy +
                latest.buy +
                latest.hold +
                latest.sell +
                latest.strongSell,
            };
          }

          for (const item of data.news) {
            news.push({
              ...item,
              ticker: p.instrument.ticker,
              name: p.instrument.name,
            });
          }
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Overview failed for ${p.instrument.ticker}: ${reason}`,
          );
        }

        return base;
      }),
    );

    return {
      holdings,
      sentiment: this.weightedSentiment(holdings),
      news: this.interleaveByHolding(news),
      covered: holdings.filter((h) => h.consensus).length,
      total: holdings.length,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * One headline per holding in rotation, newest first within each.
   *
   * Sorting the merged list purely by date lets whichever company generates
   * the most coverage fill the whole feed, which makes it a single-stock news
   * page rather than a portfolio one.
   */
  private interleaveByHolding(items: PortfolioNewsItem[]): PortfolioNewsItem[] {
    const byTicker = new Map<string, PortfolioNewsItem[]>();
    for (const item of items) {
      const list = byTicker.get(item.ticker) ?? [];
      list.push(item);
      byTicker.set(item.ticker, list);
    }

    for (const list of byTicker.values()) {
      list.sort((a, b) => b.datetime.localeCompare(a.datetime));
    }

    const queues = [...byTicker.values()];
    const out: PortfolioNewsItem[] = [];

    while (out.length < MAX_NEWS && queues.some((q) => q.length > 0)) {
      for (const queue of queues) {
        const next = queue.shift();
        if (next) out.push(next);
        if (out.length >= MAX_NEWS) break;
      }
    }

    return out;
  }

  /**
   * Each covered holding contributes its rating split in proportion to how
   * much of the portfolio it represents, so a 30% position does not count the
   * same as a 2% one. Returns null when nothing is covered.
   */
  private weightedSentiment(
    holdings: HoldingOverview[],
  ): ConsensusTally | null {
    const covered = holdings.filter(
      (h) => h.consensus && h.consensus.total > 0,
    );
    if (covered.length === 0) return null;

    const tally: ConsensusTally = {
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 0,
      total: 0,
    };

    const weightSum = covered.reduce((sum, h) => sum + h.weight, 0);
    if (weightSum <= 0) return null;

    for (const h of covered) {
      const c = h.consensus!;
      const share = h.weight / weightSum;
      tally.strongBuy += (c.strongBuy / c.total) * share;
      tally.buy += (c.buy / c.total) * share;
      tally.hold += (c.hold / c.total) * share;
      tally.sell += (c.sell / c.total) * share;
      tally.strongSell += (c.strongSell / c.total) * share;
    }

    // Expressed as percentages of the covered portfolio.
    tally.strongBuy *= 100;
    tally.buy *= 100;
    tally.hold *= 100;
    tally.sell *= 100;
    tally.strongSell *= 100;
    tally.total = 100;

    return tally;
  }
}
