import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service.js';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private userService: UserService) {}

  async generate(
    userId: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string | null> {
    const creds = await this.userService.decryptLlmKey(userId);
    if (!creds) {
      this.logger.warn('LLM Gateway not configured for user');
      return null;
    }

    const response = await fetch(`${creds.url}/api/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system: systemPrompt,
        prompt: userPrompt,
        freeOnly: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`LLM Gateway error ${response.status}: ${error}`);
      throw new Error(`LLM Gateway error: ${response.status}`);
    }

    const data = (await response.json()) as { text: string };
    return data.text;
  }
}
