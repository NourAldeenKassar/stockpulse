import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module.js';
import { CryptoModule } from './crypto/crypto.module.js';
import { AuthModule } from './auth/auth.module.js';
import { Trading212Module } from './trading212/trading212.module.js';
import { AccountModule } from './account/account.module.js';
import { SnapshotModule } from './snapshot/snapshot.module.js';
import { UserModule } from './user/user.module.js';
import { LlmModule } from './llm/llm.module.js';
import { InsightModule } from './insight/insight.module.js';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    CryptoModule,
    AuthModule,
    Trading212Module,
    AccountModule,
    SnapshotModule,
    UserModule,
    LlmModule,
    InsightModule,
  ],
})
export class AppModule {}
