import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { ConnectAccountDto } from './dto/connect-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Controller('accounts')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Post()
  connect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConnectAccountDto,
  ) {
    return this.accountService.connect(
      user.id,
      dto.apiKey,
      dto.apiSecret,
      dto.label,
    );
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.accountService.listAccounts(user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateAccount(user.id, id, dto);
  }

  @Delete(':id')
  disconnect(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.accountService.disconnect(user.id, id);
  }

  @Get(':id/summary')
  summary(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.accountService.getLiveSummary(user.id, id);
  }

  @Get(':id/positions')
  positions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.accountService.getLivePositions(user.id, id);
  }
}
