import { Module } from '@nestjs/common';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { Trading212Module } from '../trading212/trading212.module.js';

@Module({
  imports: [AuthModule, Trading212Module],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
