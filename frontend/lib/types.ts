// AccountSummary and Position are the Trading212 API shapes. They are
// re-exported from the backend definition rather than mirrored here, so the two
// cannot drift. The import is type-only and erases at compile time.
import type {
  AccountSummary,
  Position,
} from '@shared/trading212/trading212.types';

export type { AccountSummary, Position };

export interface User {
  id: string;
  email: string;
}

export interface TradingAccount {
  id: string;
  label: string;
  snapshotIntervalMin: number;
  lastSnapshotAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface Snapshot {
  id: string;
  takenAt: string;
  totalValue: number;
  cash: number;
  invested: number;
  ppl: number;
  result: number;
  positions?: Position[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LlmSettings {
  llmGatewayUrl: string;
  hasLlmKey: boolean;
  llmPremiumGatewayUrl: string;
  hasPremiumKey: boolean;
  hasFinnhubKey: boolean;
}

export interface Insight {
  title: string;
  body: string;
  type: 'warning' | 'info' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
}

/** One month of analyst recommendations. Real data, from Finnhub. */
export interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface AnalystConsensus {
  symbol: string;
  trends: RecommendationTrend[];
  industry: string | null;
  source: 'finnhub';
  fetchedAt: string;
}

/** Model-written interpretation. Opinion, not data. */
export interface StockNarrative {
  summary: string;
  consensusReading: string;
  fundamentalsReading: string;
  newsReading: string;
  positionNotes: string;
  risks: string[];
  considerations: string[];
}

export interface Fundamentals {
  currency: string | null;
  peRatio: number | null;
  pbRatio: number | null;
  beta: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  returnOnEquity: number | null;
  marketCap: number | null;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: string;
}

export interface EarningsItem {
  period: string;
  actual: number | null;
  estimate: number | null;
  surprisePercent: number | null;
}

/** Free market data. Each part is independently nullable. */
export interface StockMarketData {
  symbol: string | null;
  consensus: AnalystConsensus | null;
  fundamentals: Fundamentals | null;
  news: NewsItem[];
  earnings: EarningsItem[];
  peers: string[];
  fetchedAt: string;
}

export interface StockAnalysis {
  ticker: string;
  name: string;
  consensus: AnalystConsensus | null;
  analysis: StockNarrative | null;
  provider: string | null;
  model: string | null;
  generatedAt: string | null;
}
