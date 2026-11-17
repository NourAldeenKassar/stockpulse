import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { UpdateLlmDto } from './dto/update-llm.dto.js';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('llm-settings')
  getLlmSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getLlmSettings(user.id);
  }

  @Patch('llm-settings')
  updateLlmSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLlmDto,
  ) {
    return this.userService.updateLlmSettings(
      user.id,
      dto.llmGatewayUrl,
      dto.llmGatewayKey,
    );
  }
}
