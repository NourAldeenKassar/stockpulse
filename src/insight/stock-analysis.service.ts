import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountService } from '../account/account.service.js';
import { Trading212Service } from '../trading212/trading212.service.js';
import { FinnhubService } from '../marketdata/finnhub.service.js';
import { UserService } from '../user/user.service.js';
import { LlmService } from '../llm/llm.service.js';
import { parseJsonFromLlm } from '../llm/llm-json.js';
import { buildStockAnalysisPrompt } from './stock-analysis.prompt.js';
import type { AnalystConsensus } from '../marketdata/finnhub.types.js';
import type { Position } from '../trading212/trading212.types.js';

export interface StockNarrative {
  summary: string;
  consensusReading: string;
  positionNotes: string;
  risks: string[];
  considerations: string[];
}

export interface StockAnalysisResult {
  ticker: string;
  name: string;
  /** Real analyst data, or null when no symbol could be resolved. */
  consensus: AnalystConsensus | null;
  /** Model-written interpretation. Null when the gateway is not configured. */
  analysis: StockNarrative | null;
  provider: string | null;
  model: string | null;
  generatedAt: string | null;
}

function isNarrative(value: unknown): value is StockNarrative {
  const n = value as Partial<StockNarrative> | null;
  return Boolean(n && n.summary && n.consensusReading && n.positionNotes);
}

@Injectable()
export class StockAnalysisService {
  private readonly logger = new Logger(StockAnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private accountService: AccountService,
    private trading212: Trading212Service,
    private finnhub: FinnhubService,
    private users: UserService,
    private llm: LlmService,
  ) {}

  /** The most recent cached analysis, or null if there is none. */
  async getCached(
    accountId: string,
    ticker: string,
  ): Promise<StockAnalysisResult | null> {
    const record = await this.prisma.stockAnalysis.findFirst({
      where: { accountId, ticker },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;

    return {
      ticker: record.ticker,
      name: record.ticker,
      consensus: (record.consensus as unknown as AnalystConsensus) ?? null,
      analysis: (record.analysis as unknown as StockNarrative) ?? null,
      provider: record.provider,
      model: record.model,
      generatedAt: record.createdAt.toISOString(),
    };
  }

  async generate(
    userId: string,
    accountId: string,
    ticker: string,
  ): Promise<StockAnalysisResult> {
    const { apiKey, apiSecret } = await this.accountService.decryptCredentials(
      userId,
      accountId,
    );

    const positions = await this.trading212.getPositions(apiKey, apiSecret);
    const position = positions.find((p) => p.instrument.ticker === ticker);
    if (!position) {
      throw new NotFoundException(`No open position for ${ticker}`);
    }

    const consensus = await this.loadConsensus(userId, position);
    const portfolioValue = positions.reduce(
      (sum, p) => sum + p.walletImpact.currentValue,
      0,
    );

    const prompt = buildStockAnalysisPrompt(
      position,
      consensus,
      portfolioValue,
    );

    // Per-stock analysis is the one place worth paying for, so the gateway is
    // allowed to route this to a paid provider.
    const result = await this.llm.generate(userId, prompt, {
      freeOnly: false,
      maxTokens: 900,
    });

    if (!result) {
      throw new BadRequestException(
        'LLM Gateway is not configured. Add it in Settings to generate analysis.',
      );
    }

    const parsed = parseJsonFromLlm<unknown>(result.text);
    if (!isNarrative(parsed)) {
      this.logger.error(`Failed to parse stock analysis: ${result.text}`);
      throw new BadRequestException(
        'The model returned an unusable response. Try again.',
      );
    }

    const narrative: StockNarrative = {
      ...parsed,
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      considerations: Array.isArray(parsed.considerations)
        ? parsed.considerations
        : [],
    };

    await this.prisma.stockAnalysis.create({
      data: {
        accountId,
        ticker,
        symbol: consensus?.symbol ?? null,
        consensus: (consensus ?? undefined) as unknown as Prisma.InputJsonValue,
        analysis: narrative as unknown as Prisma.InputJsonValue,
        provider: result.provider,
        model: result.model,
      },
    });

    return {
      ticker,
      name: position.instrument.name,
      consensus,
      analysis: narrative,
      provider: result.provider,
      model: result.model,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyst data is optional: without a Finnhub key, or when the ticker cannot
   * be mapped to a symbol, the analysis proceeds on position data alone rather
   * than showing a half-populated or guessed panel.
   */
  private async loadConsensus(
    userId: string,
    position: Position,
  ): Promise<AnalystConsensus | null> {
    const finnhubKey = await this.users.decryptFinnhubKey(userId);
    if (!finnhubKey) return null;

    try {
      return await this.finnhub.getConsensus(
        finnhubKey,
        position.instrument.ticker,
        position.instrument.isin || null,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Finnhub lookup failed: ${reason}`);
      return null;
    }
  }
}
