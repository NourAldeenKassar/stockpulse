import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
