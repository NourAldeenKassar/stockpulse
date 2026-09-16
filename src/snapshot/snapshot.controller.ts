import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SnapshotService } from './snapshot.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
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
    @Req() req: any,
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    await this.accountService.decryptCredentials(req.user.id, accountId);
    return this.snapshotService.getHistory(accountId, from, to);
  }

  @Get('latest')
  async latest(@Req() req: any, @Param('accountId') accountId: string) {
    await this.accountService.decryptCredentials(req.user.id, accountId);
    return this.snapshotService.getLatest(accountId);
  }

  @Post()
  async trigger(@Req() req: any, @Param('accountId') accountId: string) {
    await this.accountService.decryptCredentials(req.user.id, accountId);
    await this.snapshotService.takeSnapshot(accountId);
    return { ok: true };
  }
}
