import { Module } from '@nestjs/common';
import { SnapshotController } from './snapshot.controller.js';
import { SnapshotService } from './snapshot.service.js';
import { SnapshotCron } from './snapshot.cron.js';
import { AccountModule } from '../account/account.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { Trading212Module } from '../trading212/trading212.module.js';

@Module({
  imports: [AccountModule, AuthModule, Trading212Module],
  controllers: [SnapshotController],
  providers: [SnapshotService, SnapshotCron],
})
export class SnapshotModule {}
