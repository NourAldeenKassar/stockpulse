import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountService } from '../account/account.service.js';
import { Trading212Service } from '../trading212/trading212.service.js';
import { LlmService } from '../llm/llm.service.js';
import { parseJsonFromLlm } from '../llm/llm-json.js';
import { buildPortfolioInsightPrompt } from './portfolio-insight.prompt.js';

export interface Insight {
  title: string;
  body: string;
  type: 'warning' | 'info' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
}

function isValidInsight(value: unknown): value is Insight {
  const i = value as Partial<Insight> | null;
  return Boolean(i && i.title && i.body && i.type && i.severity);
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

    const prompt = buildPortfolioInsightPrompt(summary, positions);
    // The whole-portfolio summary stays on the free tier. Only the per-stock
    // analysis is worth routing to a paid provider.
    const result = await this.llm.generate(userId, prompt, { freeOnly: true });

    const parsed = parseJsonFromLlm<unknown[]>(result?.text ?? null);
    if (!Array.isArray(parsed)) {
      if (result?.text) {
        this.logger.error(`Failed to parse LLM insights: ${result.text}`);
      }
      return [];
    }

    const insights = parsed.filter(isValidInsight);
    if (insights.length > 0) {
      await this.persist(accountId, insights);
    }
    return insights;
  }

  private async persist(accountId: string, insights: Insight[]) {
    await this.prisma.insightRecord.create({
      data: {
        accountId,
        insights: insights as unknown as Prisma.InputJsonValue,
      },
    });
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
