import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../crypto/crypto.service.js';
import { Trading212Service } from '../trading212/trading212.service.js';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private trading212: Trading212Service,
  ) {}

  async takeSnapshot(accountId: string) {
    const account = await this.prisma.tradingAccount.findUniqueOrThrow({
      where: { id: accountId },
    });

    const apiKey = this.crypto.decrypt(
      account.apiKeyEncrypted,
      account.encryptionIv,
      account.encryptionTag,
    );
    const apiSecret = this.crypto.decrypt(
      account.apiSecretEncrypted,
      account.secretEncryptionIv,
      account.secretEncryptionTag,
    );

    const [summary, positions] = await Promise.all([
      this.trading212.getAccountSummary(apiKey, apiSecret),
      this.trading212.getPositions(apiKey, apiSecret),
    ]);

    await this.prisma.$transaction([
      this.prisma.portfolioSnapshot.create({
        data: {
          accountId: account.id,
          totalValue: summary.totalValue,
          cash: summary.cash.availableToTrade,
          invested: summary.investments.totalCost,
          ppl: summary.investments.unrealizedProfitLoss,
          result: summary.investments.realizedProfitLoss,
          positions: positions as any,
        },
      }),
      this.prisma.tradingAccount.update({
        where: { id: account.id },
        data: { lastSnapshotAt: new Date() },
      }),
    ]);

    this.logger.log(`Snapshot taken for account ${account.id}`);
  }

  async getHistory(
    accountId: string,
    from?: string,
    to?: string,
  ) {
    const where: any = { accountId };

    if (from || to) {
      where.takenAt = {};
      if (from) where.takenAt.gte = new Date(from);
      if (to) where.takenAt.lte = new Date(to);
    }

    return this.prisma.portfolioSnapshot.findMany({
      where,
      select: {
        id: true,
        takenAt: true,
        totalValue: true,
        cash: true,
        invested: true,
        ppl: true,
        result: true,
      },
      orderBy: { takenAt: 'asc' },
    });
  }

  async getLatest(accountId: string) {
    return this.prisma.portfolioSnapshot.findFirst({
      where: { accountId },
      orderBy: { takenAt: 'desc' },
    });
  }
}
