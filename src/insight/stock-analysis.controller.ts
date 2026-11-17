import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { AccountService } from '../account/account.service.js';
import { StockAnalysisService } from './stock-analysis.service.js';

@Controller('accounts/:accountId/stocks/:ticker/analysis')
@UseGuards(AuthGuard)
export class StockAnalysisController {
  constructor(
    private stockAnalysis: StockAnalysisService,
    private accountService: AccountService,
  ) {}

  @Get()
  async getCached(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Param('ticker') ticker: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.stockAnalysis.getCached(accountId, ticker);
  }

  @Post()
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Param('ticker') ticker: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.stockAnalysis.generate(user.id, accountId, ticker);
  }
}
