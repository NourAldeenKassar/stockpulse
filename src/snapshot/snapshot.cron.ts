import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { SnapshotService } from './snapshot.service.js';

@Injectable()
export class SnapshotCron {
  private readonly logger = new Logger(SnapshotCron.name);

  constructor(
    private prisma: PrismaService,
    private snapshotService: SnapshotService,
  ) {}

  @Cron('0 */5 * * * *')
  async handleCron() {
    const accounts = await this.prisma.tradingAccount.findMany({
      where: { active: true },
    });

    for (const account of accounts) {
      const intervalMs = account.snapshotIntervalMin * 60 * 1000;
      const lastSnapshot = account.lastSnapshotAt?.getTime() ?? 0;

      if (Date.now() - lastSnapshot < intervalMs) continue;

      try {
        await this.snapshotService.takeSnapshot(account.id);
      } catch (err) {
        this.logger.error(
          `Snapshot failed for account ${account.id}: ${err}`,
        );
      }
    }
  }
}
