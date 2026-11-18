/** One month of analyst recommendations, as Finnhub reports them. */
export interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  exchange: string;
  finnhubIndustry: string;
  currency: string;
  weburl: string;
  logo: string;
}

export interface SymbolSearchResult {
  count: number;
  result: Array<{
    symbol: string;
    displaySymbol: string;
    description: string;
    type: string;
  }>;
}

/** What the stock analysis needs: real numbers, plus where they came from. */
export interface AnalystConsensus {
  symbol: string;
  trends: RecommendationTrend[];
  industry: string | null;
  source: 'finnhub';
  fetchedAt: string;
}

/** Selected fields from Finnhub's Basic Financials. All optional: coverage varies. */
export interface Fundamentals {
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

/**
 * Everything free we can show for a holding. Each part is independently
 * nullable: Finnhub's coverage varies by instrument and some endpoints are
 * premium-gated, so one missing piece must not hide the rest.
 */
export interface StockMarketData {
  symbol: string | null;
  consensus: AnalystConsensus | null;
  fundamentals: Fundamentals | null;
  news: NewsItem[];
  earnings: EarningsItem[];
  peers: string[];
  fetchedAt: string;
}
