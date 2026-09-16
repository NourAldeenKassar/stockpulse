import { Module } from '@nestjs/common';
import { InsightController } from './insight.controller.js';
import { InsightService } from './insight.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AccountModule } from '../account/account.module.js';
import { Trading212Module } from '../trading212/trading212.module.js';
import { LlmModule } from '../llm/llm.module.js';

@Module({
  imports: [AuthModule, AccountModule, Trading212Module, LlmModule],
  controllers: [InsightController],
  providers: [InsightService],
})
export class InsightModule {}
