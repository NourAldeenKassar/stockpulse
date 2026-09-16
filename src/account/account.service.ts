import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../crypto/crypto.service.js';
import { Trading212Service } from '../trading212/trading212.service.js';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private trading212: Trading212Service,
  ) {}

  async connect(
    userId: string,
    apiKey: string,
    apiSecret: string,
    label?: string,
  ) {
    let summary;
    try {
      summary = await this.trading212.getAccountSummary(apiKey, apiSecret);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('401')) {
        throw new BadRequestException(
          'Invalid credentials — Trading212 rejected the API key/secret',
        );
      }
      throw new BadRequestException(
        `Could not connect to Trading212: ${msg}`,
      );
    }

    if (summary.totalValue === undefined) {
      throw new BadRequestException(
        'Invalid credentials — could not fetch account summary',
      );
    }

    const encryptedKey = this.crypto.encrypt(apiKey);
    const encryptedSecret = this.crypto.encrypt(apiSecret);

    const account = await this.prisma.tradingAccount.create({
      data: {
        userId,
        label: label || 'Main',
        apiKeyEncrypted: encryptedKey.ciphertext,
        encryptionIv: encryptedKey.iv,
        encryptionTag: encryptedKey.tag,
        apiSecretEncrypted: encryptedSecret.ciphertext,
        secretEncryptionIv: encryptedSecret.iv,
        secretEncryptionTag: encryptedSecret.tag,
      },
    });

    return {
      id: account.id,
      label: account.label,
      snapshotIntervalMin: account.snapshotIntervalMin,
      active: account.active,
      createdAt: account.createdAt,
    };
  }

  async listAccounts(userId: string) {
    const accounts = await this.prisma.tradingAccount.findMany({
      where: { userId },
      select: {
        id: true,
        label: true,
        snapshotIntervalMin: true,
        lastSnapshotAt: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return accounts;
  }

  async updateAccount(
    userId: string,
    accountId: string,
    data: { label?: string; snapshotIntervalMin?: number },
  ) {
    const account = await this.getOwnAccount(userId, accountId);
    return this.prisma.tradingAccount.update({
      where: { id: account.id },
      data,
      select: {
        id: true,
        label: true,
        snapshotIntervalMin: true,
        lastSnapshotAt: true,
        active: true,
      },
    });
  }

  async disconnect(userId: string, accountId: string) {
    const account = await this.getOwnAccount(userId, accountId);
    await this.prisma.tradingAccount.delete({ where: { id: account.id } });
  }

  async getLiveSummary(userId: string, accountId: string) {
    const { apiKey, apiSecret } = await this.decryptCredentials(
      userId,
      accountId,
    );
    return this.trading212.getAccountSummary(apiKey, apiSecret);
  }

  async getLivePositions(userId: string, accountId: string) {
    const { apiKey, apiSecret } = await this.decryptCredentials(
      userId,
      accountId,
    );
    return this.trading212.getPositions(apiKey, apiSecret);
  }

  async decryptCredentials(
    userId: string,
    accountId: string,
  ): Promise<{ apiKey: string; apiSecret: string }> {
    const account = await this.getOwnAccount(userId, accountId);
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
    return { apiKey, apiSecret };
  }

  private async getOwnAccount(userId: string, accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId)
      throw new ForbiddenException('Not your account');
    return account;
  }
}
