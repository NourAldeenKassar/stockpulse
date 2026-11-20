import { Module } from '@nestjs/common';
import { InsightController } from './insight.controller.js';
import { InsightService } from './insight.service.js';
import { StockAnalysisController } from './stock-analysis.controller.js';
import { StockAnalysisService } from './stock-analysis.service.js';
import { MarketOverviewController } from './market-overview.controller.js';
import { MarketOverviewService } from './market-overview.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AccountModule } from '../account/account.module.js';
import { Trading212Module } from '../trading212/trading212.module.js';
import { LlmModule } from '../llm/llm.module.js';
import { UserModule } from '../user/user.module.js';
import { MarketDataModule } from '../marketdata/marketdata.module.js';

@Module({
  imports: [
    AuthModule,
    AccountModule,
    Trading212Module,
    LlmModule,
    UserModule,
    MarketDataModule,
  ],
  controllers: [
    InsightController,
    StockAnalysisController,
    MarketOverviewController,
  ],
  providers: [InsightService, StockAnalysisService, MarketOverviewService],
})
export class InsightModule {}
