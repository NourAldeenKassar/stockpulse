import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ConnectAccountDto } from './dto/connect-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Controller('accounts')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Post()
  connect(@Req() req: any, @Body() dto: ConnectAccountDto) {
    return this.accountService.connect(
      req.user.id,
      dto.apiKey,
      dto.apiSecret,
      dto.label,
    );
  }

  @Get()
  list(@Req() req: any) {
    return this.accountService.listAccounts(req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateAccount(req.user.id, id, dto);
  }

  @Delete(':id')
  disconnect(@Req() req: any, @Param('id') id: string) {
    return this.accountService.disconnect(req.user.id, id);
  }

  @Get(':id/summary')
  summary(@Req() req: any, @Param('id') id: string) {
    return this.accountService.getLiveSummary(req.user.id, id);
  }

  @Get(':id/positions')
  positions(@Req() req: any, @Param('id') id: string) {
    return this.accountService.getLivePositions(req.user.id, id);
  }
}
