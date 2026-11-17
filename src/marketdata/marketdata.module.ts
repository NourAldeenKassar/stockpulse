import { Module } from '@nestjs/common';
import { FinnhubService } from './finnhub.service.js';

@Module({
  providers: [FinnhubService],
  exports: [FinnhubService],
})
export class MarketDataModule {}
