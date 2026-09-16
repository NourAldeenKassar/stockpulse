import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { UpdateLlmDto } from './dto/update-llm.dto.js';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('llm-settings')
  getLlmSettings(@Req() req: any) {
    return this.userService.getLlmSettings(req.user.id);
  }

  @Patch('llm-settings')
  updateLlmSettings(@Req() req: any, @Body() dto: UpdateLlmDto) {
    return this.userService.updateLlmSettings(
      req.user.id,
      dto.llmGatewayUrl,
      dto.llmGatewayKey,
    );
  }
}
