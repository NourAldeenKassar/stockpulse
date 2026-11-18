import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import type { LlmPrompt } from './llm.types.js';

export interface LlmOptions {
  /**
   * false lets the gateway route to paid providers. The gateway itself has no
   * notion of cheap and expensive keys: this flag is what picks the tier.
   */
  freeOnly: boolean;
  /**
   * Which stored credentials to use. 'premium' prefers the separate premium
   * gateway when one is configured, so its spend is tracked under its own key.
   */
  tier?: 'standard' | 'premium';
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResult {
  text: string;
  provider: string;
  model: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private userService: UserService) {}

  async generate(
    userId: string,
    prompt: LlmPrompt,
    options: LlmOptions,
  ): Promise<LlmResult | null> {
    const creds = await this.userService.decryptLlmKey(
      userId,
      options.tier ?? 'standard',
    );
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
        system: prompt.system,
        prompt: prompt.user,
        freeOnly: options.freeOnly,
        ...(options.temperature !== undefined && {
          temperature: options.temperature,
        }),
        ...(options.maxTokens !== undefined && {
          maxTokens: options.maxTokens,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`LLM Gateway error ${response.status}: ${error}`);
      throw new Error(`LLM Gateway error: ${response.status}`);
    }

    const data = (await response.json()) as Partial<LlmResult>;
    return {
      text: data.text ?? '',
      provider: data.provider ?? 'unknown',
      model: data.model ?? 'unknown',
    };
  }
}
