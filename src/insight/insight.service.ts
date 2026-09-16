import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountService } from '../account/account.service.js';
import { Trading212Service } from '../trading212/trading212.service.js';
import { LlmService } from '../llm/llm.service.js';
import type { Position } from '../trading212/trading212.types.js';

export interface Insight {
  title: string;
  body: string;
  type: 'warning' | 'info' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class InsightService {
  private readonly logger = new Logger(InsightService.name);

  constructor(
    private prisma: PrismaService,
    private accountService: AccountService,
    private trading212: Trading212Service,
    private llm: LlmService,
  ) {}

  async generateInsights(
    userId: string,
    accountId: string,
  ): Promise<Insight[]> {
    const { apiKey, apiSecret } = await this.accountService.decryptCredentials(
      userId,
      accountId,
    );

    const [summary, positions] = await Promise.all([
      this.trading212.getAccountSummary(apiKey, apiSecret),
      this.trading212.getPositions(apiKey, apiSecret),
    ]);

    const totalInvested = summary.investments.totalCost;
    const totalValue = summary.totalValue;

    const positionsSummary = positions
      .map((p: Position) => {
        const allocation =
          totalValue > 0
            ? ((p.walletImpact.currentValue / totalValue) * 100).toFixed(1)
            : '0';
        return `- ${p.instrument.name} (${p.instrument.ticker}): ${allocation}% allocation, ${p.walletImpact.currentValue.toFixed(2)} ${p.walletImpact.currency} value, P&L: ${p.walletImpact.unrealizedProfitLoss.toFixed(2)}`;
      })
      .join('\n');

    const systemPrompt = `You are a portfolio analysis assistant. You analyze investment portfolios and provide actionable, concise insights. You MUST respond with ONLY a valid JSON array. No markdown, no code fences, no text before or after the JSON.`;

    const userPrompt = `Analyze this Trading212 portfolio and provide 3-5 insights:

Portfolio Summary:
- Total Value: ${totalValue.toFixed(2)} ${summary.currency}
- Cash Available: ${summary.cash.availableToTrade.toFixed(2)} ${summary.currency}
- Total Invested: ${totalInvested.toFixed(2)} ${summary.currency}
- Unrealized P&L: ${summary.investments.unrealizedProfitLoss.toFixed(2)} ${summary.currency}
- Realized P&L: ${summary.investments.realizedProfitLoss.toFixed(2)} ${summary.currency}
- Number of positions: ${positions.length}

Positions:
${positionsSummary}

Provide insights covering any of these:
1. Concentration risk (if any single position is >30% of portfolio)
2. Diversification analysis (sectors, geography, asset types)
3. Position sizing observations
4. Cash allocation commentary
5. P&L observations and suggestions
6. Any notable patterns or risks

Return a JSON array with this exact format:
[{"title":"Short title","body":"Detailed explanation in 1-2 sentences","type":"warning|info|suggestion","severity":"low|medium|high"}]`;

    const raw = await this.llm.generate(userId, systemPrompt, userPrompt);

    if (!raw) {
      return [];
    }

    const content = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    try {
      const insights = (JSON.parse(content) as Insight[]).filter(
        (i) => i.title && i.body && i.type && i.severity,
      );

      if (insights.length > 0) {
        await this.prisma.insightRecord.create({
          data: {
            accountId,
            insights: insights as any,
          },
        });
      }

      return insights;
    } catch (err) {
      this.logger.error(`Failed to parse LLM insights: ${content}`);
      return [];
    }
  }

  async getLatest(accountId: string): Promise<Insight[]> {
    const record = await this.prisma.insightRecord.findFirst({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return [];
    return record.insights as unknown as Insight[];
  }
}
