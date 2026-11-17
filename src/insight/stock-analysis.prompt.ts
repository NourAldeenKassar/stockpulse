import type { Position } from '../trading212/trading212.types.js';
import type { AnalystConsensus } from '../marketdata/finnhub.types.js';
import type { LlmPrompt } from '../llm/llm.types.js';

function describeConsensus(consensus: AnalystConsensus | null): string {
  if (!consensus || consensus.trends.length === 0) {
    return 'No analyst consensus data is available for this instrument. Do not invent ratings, price targets or analyst opinions. Say plainly that no analyst data was available.';
  }

  const rows = consensus.trends
    .map(
      (t) =>
        `- ${t.period}: strong buy ${t.strongBuy}, buy ${t.buy}, hold ${t.hold}, sell ${t.sell}, strong sell ${t.strongSell}`,
    )
    .join('\n');

  return `Analyst recommendation counts for ${consensus.symbol} (source: Finnhub, most recent first):
${rows}

These counts are real data. Use them. Do not add price targets or any figure not listed above.`;
}

export function buildStockAnalysisPrompt(
  position: Position,
  consensus: AnalystConsensus | null,
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

  return {
    system: `You are an investment analysis assistant. You interpret real data for an individual investor and are explicit about uncertainty. You never invent analyst ratings, price targets or figures that were not given to you. You are not giving financial advice. You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no text before or after the JSON.`,

    user: `Analyse this holding for the investor who owns it.

The holding:
- Instrument: ${position.instrument.name} (${position.instrument.ticker})
- Currency: ${position.instrument.currency}
- Quantity: ${position.quantity}
- Average price paid: ${position.averagePricePaid}
- Current price: ${position.currentPrice}
- Position value: ${w.currentValue.toFixed(2)} ${w.currency}
- Cost basis: ${w.totalCost.toFixed(2)} ${w.currency}
- Unrealised P&L: ${w.unrealizedProfitLoss.toFixed(2)} ${w.currency} (${pnlPercent}%)
- Share of the whole portfolio: ${weight}%
${consensus?.industry ? `- Industry: ${consensus.industry}` : ''}

${describeConsensus(consensus)}

Write an analysis that is specific to THIS investor's position, not generic commentary about the company. Cover what the analyst consensus implies, how the position size compares to the rest of the portfolio, and what the gain or loss so far suggests about the entry.

Return a JSON object with exactly this shape:
{"summary":"2-3 sentences on where this position stands","consensusReading":"what the analyst counts suggest, or that none were available","positionNotes":"observations specific to this investor's size, cost basis and P&L","risks":["short risk","short risk"],"considerations":["something to think about","something to think about"]}`,
  };
}
