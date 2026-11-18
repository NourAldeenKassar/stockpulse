import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { AccountService } from '../account/account.service.js';
import { StockAnalysisService } from './stock-analysis.service.js';

@Controller('accounts/:accountId/stocks/:ticker')
@UseGuards(AuthGuard)
export class StockAnalysisController {
  constructor(
    private stockAnalysis: StockAnalysisService,
    private accountService: AccountService,
  ) {}

  /**
   * Free analyst data, fundamentals, news, earnings and peers. Separate from
   * the analysis endpoints so opening a holding costs nothing.
   */
  @Get('market-data')
  async marketData(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Param('ticker') ticker: string,
    @Query('isin') isin?: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.stockAnalysis.getMarketData(user.id, ticker, isin ?? null);
  }

  @Get('analysis')
  async getCached(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Param('ticker') ticker: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.stockAnalysis.getCached(accountId, ticker);
  }

  @Post('analysis')
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Param('ticker') ticker: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.stockAnalysis.generate(user.id, accountId, ticker);
  }
}
