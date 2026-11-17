import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { RateLimiter } from '../common/rate-limiter.js';
import type { RateLimitConfig } from '../common/rate-limiter.js';
import { Trading212ApiError } from './trading212.error.js';
import type {
  AccountSummary,
  Position,
  Transaction,
  Dividend,
  HistoricalOrder,
  PaginatedResponse,
} from './trading212.types.js';

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  accountSummary: { maxCalls: 1, windowMs: 5000 },
  positions: { maxCalls: 1, windowMs: 1000 },
  dividends: { maxCalls: 6, windowMs: 60000 },
  orders: { maxCalls: 6, windowMs: 60000 },
  transactions: { maxCalls: 6, windowMs: 60000 },
  instruments: { maxCalls: 1, windowMs: 50000 },
};

const MAX_ATTEMPTS = 3;

@Injectable()
export class Trading212Service {
  private readonly logger = new Logger(Trading212Service.name);
  private readonly baseUrl: string;
  private readonly limiter = new RateLimiter();

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

  /**
   * Trading212 applies its limits per account, so the limiter must key on the
   * credentials as well as the endpoint. A shared key would make every user
   * contend for one budget.
   */
  private rateLimitKey(apiKey: string, endpoint: string): string {
    const account = createHash('sha256')
      .update(apiKey)
      .digest('hex')
      .slice(0, 16);
    return `${account}:${endpoint}`;
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
    endpoint: string,
  ): Promise<T[]> {
    const all: T[] = [];
    let currentPath: string | null = `${path}?limit=50`;

    while (currentPath) {
      const page: PaginatedResponse<T> = await this.request<
        PaginatedResponse<T>
      >(apiKey, apiSecret, currentPath, endpoint);
      all.push(...page.items);
      currentPath = page.nextPagePath || null;
    }

    return all;
  }

  private async request<T>(
    apiKey: string,
    apiSecret: string,
    path: string,
    endpoint: string,
    attempt = 1,
  ): Promise<T> {
    const config = RATE_LIMITS[endpoint];
    if (config) {
      await this.limiter.acquire(this.rateLimitKey(apiKey, endpoint), config);
    }

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      headers: { Authorization: this.buildAuthHeader(apiKey, apiSecret) },
    });

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_ATTEMPTS) {
      const delay = Math.pow(2, attempt) * 1000;
      this.logger.warn(
        `T212 ${res.status} on ${path}, retrying in ${delay}ms (attempt ${attempt})`,
      );
      await new Promise((r) => setTimeout(r, delay));
      return this.request<T>(apiKey, apiSecret, path, endpoint, attempt + 1);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`T212 API ${res.status} on ${path}: ${body}`);
      throw new Trading212ApiError(res.status, path, body);
    }

    return res.json() as Promise<T>;
  }
}
