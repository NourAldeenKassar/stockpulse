import { Module } from '@nestjs/common';
import { Trading212Service } from './trading212.service.js';

@Module({
  providers: [Trading212Service],
  exports: [Trading212Service],
})
export class Trading212Module {}
