import type { Position } from '../trading212/trading212.types.js';
import type { StockMarketData } from '../marketdata/finnhub.types.js';
import type { LlmPrompt } from '../llm/llm.types.js';

function describeConsensus(data: StockMarketData | null): string {
  const consensus = data?.consensus;
  if (!consensus || consensus.trends.length === 0) {
    return 'ANALYST RATINGS: none available for this instrument. Do not invent ratings, price targets or analyst opinions. Say plainly that no analyst data was available.';
  }

  const rows = consensus.trends
    .map(
      (t) =>
        `- ${t.period}: strong buy ${t.strongBuy}, buy ${t.buy}, hold ${t.hold}, sell ${t.sell}, strong sell ${t.strongSell}`,
    )
    .join('\n');

  return `ANALYST RATINGS for ${consensus.symbol} (source: Finnhub, most recent first):
${rows}`;
}

function describeFundamentals(data: StockMarketData | null): string {
  const f = data?.fundamentals;
  if (!f) return 'FUNDAMENTALS: not available.';

  const rows: string[] = [];
  const add = (label: string, value: number | null, suffix = '') => {
    if (value !== null) rows.push(`- ${label}: ${value.toFixed(2)}${suffix}`);
  };

  add('P/E (TTM)', f.peRatio);
  add('P/B', f.pbRatio);
  add('Beta', f.beta);
  add('Dividend yield', f.dividendYield, '%');
  add('52-week high', f.week52High);
  add('52-week low', f.week52Low);
  add('Gross margin (TTM)', f.grossMargin, '%');
  add('Net margin (TTM)', f.netMargin, '%');
  add('Return on equity (TTM)', f.returnOnEquity, '%');
  add('Market cap (millions)', f.marketCap);

  return rows.length > 0
    ? `FUNDAMENTALS:\n${rows.join('\n')}`
    : 'FUNDAMENTALS: not available.';
}

function describeEarnings(data: StockMarketData | null): string {
  const earnings = data?.earnings ?? [];
  if (earnings.length === 0) return 'EARNINGS: not available.';

  const rows = earnings
    .map((e) => {
      const surprise =
        e.surprisePercent !== null
          ? ` (${e.surprisePercent > 0 ? '+' : ''}${e.surprisePercent.toFixed(1)}% vs estimate)`
          : '';
      return `- ${e.period}: actual ${e.actual ?? 'n/a'}, estimate ${e.estimate ?? 'n/a'}${surprise}`;
    })
    .join('\n');

  return `EARNINGS, most recent first:\n${rows}`;
}

function describeNews(data: StockMarketData | null): string {
  const news = data?.news ?? [];
  if (news.length === 0) return 'RECENT NEWS: none retrieved.';

  const rows = news
    .map((n) => `- ${n.datetime.slice(0, 10)} (${n.source}): ${n.headline}`)
    .join('\n');

  return `RECENT NEWS headlines, last 30 days:\n${rows}`;
}

function describePeers(data: StockMarketData | null): string {
  const peers = data?.peers ?? [];
  if (peers.length === 0) return '';
  return `PEERS: ${peers.join(', ')}`;
}

export function buildStockAnalysisPrompt(
  position: Position,
  data: StockMarketData | null,
  portfolioValue: number,
): LlmPrompt {
  const w = position.walletImpact;
  const weight =
    portfolioValue > 0
      ? ((w.currentValue / portfolioValue) * 100).toFixed(1)
      : '0';
  const pnlPercent =
    position.averagePricePaid > 0
      ? (
          ((position.currentPrice - position.averagePricePaid) /
            position.averagePricePaid) *
          100
        ).toFixed(2)
      : '0';

  const sections = [
    describeConsensus(data),
    describeFundamentals(data),
    describeEarnings(data),
    describeNews(data),
    describePeers(data),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    system: `You are an investment analysis assistant. You interpret real data for an individual investor and are explicit about uncertainty. Every figure you cite must come from the data supplied to you: never invent analyst ratings, price targets, fundamentals or news. If something was not supplied, say it was not available. You are not giving financial advice. You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no text before or after the JSON.`,

    user: `Analyse this holding for the investor who owns it.

THE HOLDING:
- Instrument: ${position.instrument.name} (${position.instrument.ticker})
- Currency: ${position.instrument.currency}
- Quantity: ${position.quantity}
- Average price paid: ${position.averagePricePaid}
- Current price: ${position.currentPrice}
- Position value: ${w.currentValue.toFixed(2)} ${w.currency}
- Cost basis: ${w.totalCost.toFixed(2)} ${w.currency}
- Unrealised P&L: ${w.unrealizedProfitLoss.toFixed(2)} ${w.currency} (${pnlPercent}%)
- Share of the whole portfolio: ${weight}%
${data?.consensus?.industry ? `- Industry: ${data.consensus.industry}` : ''}

${sections}

Write an analysis specific to THIS investor's position, not generic commentary about the company. Where the data supports it, connect the fundamentals, earnings record and recent news to what the analyst ratings say and to this investor's entry price and position size. Where data is missing, say so rather than filling the gap.

Return a JSON object with exactly this shape:
{"summary":"2-3 sentences on where this position stands","consensusReading":"what the analyst counts suggest, or that none were available","fundamentalsReading":"what the valuation, margins and earnings record suggest, or that none were available","newsReading":"what recent headlines suggest, or that none were retrieved","positionNotes":"observations specific to this investor's size, cost basis and P&L","risks":["short risk","short risk"],"considerations":["something to think about","something to think about"]}`,
  };
}
