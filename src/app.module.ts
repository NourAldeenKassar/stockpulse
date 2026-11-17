import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    // The dashboard polls summary and positions every 5s, so the default
    // ceiling is generous. Auth routes override it with a much tighter limit.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    CryptoModule,
    AuthModule,
    Trading212Module,
    AccountModule,
    SnapshotModule,
    UserModule,
    LlmModule,
    InsightModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
