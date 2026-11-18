import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { AccountService } from '../account/account.service.js';
import { MarketOverviewService } from './market-overview.service.js';

@Controller('accounts/:accountId/market-overview')
@UseGuards(AuthGuard)
export class MarketOverviewController {
  constructor(
    private overview: MarketOverviewService,
    private accountService: AccountService,
  ) {}

  @Get()
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.overview.getOverview(user.id, accountId);
  }
}
