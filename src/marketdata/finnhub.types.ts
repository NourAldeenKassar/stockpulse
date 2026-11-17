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
