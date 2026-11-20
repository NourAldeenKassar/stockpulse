import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { InsightService } from './insight.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { AccountService } from '../account/account.service.js';

@Controller('accounts/:accountId/insights')
@UseGuards(AuthGuard)
export class InsightController {
  constructor(
    private insightService: InsightService,
    private accountService: AccountService,
  ) {}

  @Get()
  async getLatest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.insightService.getLatest(accountId);
  }

  @Post('generate')
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
  ) {
    return this.insightService.generateInsights(user.id, accountId);
  }
}
