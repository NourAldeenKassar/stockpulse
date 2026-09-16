import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { InsightService } from './insight.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AccountService } from '../account/account.service.js';

@Controller('accounts/:accountId/insights')
@UseGuards(AuthGuard)
export class InsightController {
  constructor(
    private insightService: InsightService,
    private accountService: AccountService,
  ) {}

  @Get()
  async getLatest(@Req() req: any, @Param('accountId') accountId: string) {
    await this.accountService.decryptCredentials(req.user.id, accountId);
    return this.insightService.getLatest(accountId);
  }

  @Post('generate')
  generate(@Req() req: any, @Param('accountId') accountId: string) {
    return this.insightService.generateInsights(req.user.id, accountId);
  }
}
