import type {
  AccountSummary,
  Position,
} from '../trading212/trading212.types.js';
import type { LlmPrompt } from '../llm/llm.types.js';

function describePositions(positions: Position[], totalValue: number): string {
  return positions
    .map((p) => {
      const allocation =
        totalValue > 0
          ? ((p.walletImpact.currentValue / totalValue) * 100).toFixed(1)
          : '0';
      return `- ${p.instrument.name} (${p.instrument.ticker}): ${allocation}% allocation, ${p.walletImpact.currentValue.toFixed(2)} ${p.walletImpact.currency} value, P&L: ${p.walletImpact.unrealizedProfitLoss.toFixed(2)}`;
    })
    .join('\n');
}

export function buildPortfolioInsightPrompt(
  summary: AccountSummary,
  positions: Position[],
): LlmPrompt {
  const totalValue = summary.totalValue;
  const currency = summary.currency;

  return {
    system:
      'You are a portfolio analysis assistant. You analyze investment portfolios and provide actionable, concise insights. You MUST respond with ONLY a valid JSON array. No markdown, no code fences, no text before or after the JSON.',
    user: `Analyze this Trading212 portfolio and provide 3-5 insights:

Portfolio Summary:
- Total Value: ${totalValue.toFixed(2)} ${currency}
- Cash Available: ${summary.cash.availableToTrade.toFixed(2)} ${currency}
- Total Invested: ${summary.investments.totalCost.toFixed(2)} ${currency}
- Unrealized P&L: ${summary.investments.unrealizedProfitLoss.toFixed(2)} ${currency}
- Realized P&L: ${summary.investments.realizedProfitLoss.toFixed(2)} ${currency}
- Number of positions: ${positions.length}

Positions:
${describePositions(positions, totalValue)}

Provide insights covering any of these:
1. Concentration risk (if any single position is >30% of portfolio)
2. Diversification analysis (sectors, geography, asset types)
3. Position sizing observations
4. Cash allocation commentary
5. P&L observations and suggestions
6. Any notable patterns or risks

Return a JSON array with this exact format:
[{"title":"Short title","body":"Detailed explanation in 1-2 sentences","type":"warning|info|suggestion","severity":"low|medium|high"}]`,
  };
}
