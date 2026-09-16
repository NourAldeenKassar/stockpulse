import { Injectable, Logger } from '@nestjs/common';
import type {
  AccountSummary,
  Position,
  Transaction,
  Dividend,
  HistoricalOrder,
  PaginatedResponse,
} from './trading212.types.js';

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  accountSummary: { maxCalls: 1, windowMs: 5000 },
  positions: { maxCalls: 1, windowMs: 1000 },
  dividends: { maxCalls: 6, windowMs: 60000 },
  orders: { maxCalls: 6, windowMs: 60000 },
  transactions: { maxCalls: 6, windowMs: 60000 },
  instruments: { maxCalls: 1, windowMs: 50000 },
};

@Injectable()
export class Trading212Service {
  private readonly logger = new Logger(Trading212Service.name);
  private readonly baseUrl: string;
  private readonly callTimestamps = new Map<string, number[]>();

  constructor() {
    this.baseUrl =
      process.env.TRADING212_BASE_URL || 'https://live.trading212.com';
  }

  private buildAuthHeader(apiKey: string, apiSecret: string): string {
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString(
      'base64',
    );
    return `Basic ${credentials}`;
  }

  async getAccountSummary(
    apiKey: string,
    apiSecret: string,
  ): Promise<AccountSummary> {
    return this.request<AccountSummary>(
      apiKey,
      apiSecret,
      '/api/v0/equity/account/summary',
      'accountSummary',
    );
  }

  async getPositions(apiKey: string, apiSecret: string): Promise<Position[]> {
    return this.request<Position[]>(
      apiKey,
      apiSecret,
      '/api/v0/equity/positions',
      'positions',
    );
  }

  async getDividends(apiKey: string, apiSecret: string): Promise<Dividend[]> {
    return this.paginateAll<Dividend>(
      apiKey,
      apiSecret,
      '/api/v0/equity/history/dividends',
      'dividends',
    );
  }

  async getOrders(
    apiKey: string,
    apiSecret: string,
  ): Promise<HistoricalOrder[]> {
    return this.paginateAll<HistoricalOrder>(
      apiKey,
      apiSecret,
      '/api/v0/equity/history/orders',
      'orders',
    );
  }

  async getTransactions(
    apiKey: string,
    apiSecret: string,
  ): Promise<Transaction[]> {
    return this.paginateAll<Transaction>(
      apiKey,
      apiSecret,
      '/api/v0/equity/history/transactions',
      'transactions',
    );
  }

  private async paginateAll<T>(
    apiKey: string,
    apiSecret: string,
    path: string,
    rateLimitKey: string,
  ): Promise<T[]> {
    const all: T[] = [];
    let currentPath: string | null = `${path}?limit=50`;

    while (currentPath) {
      const page = await this.request<PaginatedResponse<T>>(
        apiKey,
        apiSecret,
        currentPath,
        rateLimitKey,
      );
      all.push(...page.items);
      currentPath = page.nextPagePath || null;
    }

    return all;
  }

  private async request<T>(
    apiKey: string,
    apiSecret: string,
    path: string,
    rateLimitKey: string,
    attempt = 1,
  ): Promise<T> {
    await this.waitForRateLimit(rateLimitKey);

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      headers: { Authorization: this.buildAuthHeader(apiKey, apiSecret) },
    });

    if (res.status === 429 || (res.status >= 500 && attempt < 3)) {
      const delay = Math.pow(2, attempt) * 1000;
      this.logger.warn(
        `T212 ${res.status} on ${path}, retrying in ${delay}ms (attempt ${attempt})`,
      );
      await new Promise((r) => setTimeout(r, delay));
      return this.request<T>(apiKey, apiSecret, path, rateLimitKey, attempt + 1);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(
        `T212 API ${res.status} on ${path}: ${body}`,
      );
      throw new Error(`Trading212 API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  private async waitForRateLimit(key: string): Promise<void> {
    const config = RATE_LIMITS[key];
    if (!config) return;

    const timestamps = this.callTimestamps.get(key) || [];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const recent = timestamps.filter((t) => t > windowStart);

    if (recent.length >= config.maxCalls) {
      const oldest = recent[0];
      const waitMs = oldest + config.windowMs - now + 100;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    recent.push(Date.now());
    this.callTimestamps.set(key, recent);
  }
}
