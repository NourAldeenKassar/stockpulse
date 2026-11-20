import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { SnapshotService } from './snapshot.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { AccountService } from '../account/account.service.js';

@Controller('accounts/:accountId/snapshots')
@UseGuards(AuthGuard)
export class SnapshotController {
  constructor(
    private snapshotService: SnapshotService,
    private accountService: AccountService,
  ) {}

  @Get()
  async history(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.snapshotService.getHistory(accountId, from, to);
  }

  @Get('latest')
  async latest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    return this.snapshotService.getLatest(accountId);
  }

  @Post()
  async trigger(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId') accountId: string,
  ) {
    await this.accountService.assertOwnership(user.id, accountId);
    await this.snapshotService.takeSnapshot(accountId);
    return { ok: true };
  }
}
