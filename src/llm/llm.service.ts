import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import type { LlmPrompt } from './llm.types.js';

// A gateway that is simply unreachable should fail fast, not hang the request.
const REQUEST_TIMEOUT_MS = 120_000;

export interface LlmOptions {
  /**
   * Sent for gateways that select a tier per request. Newer LLM Gateway
   * versions derive the tier from the API key instead and ignore this, which
   * is why the premium tier is configured as a separate key rather than a
   * flag — see `tier` below.
   */
  freeOnly: boolean;
  /**
   * Which stored credentials to use. 'premium' prefers the separate premium
   * gateway when one is configured. Since the gateway reads the tier from the
   * key, a key issued on its paid tier is what actually routes this to a paid
   * provider.
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

    let response: Response;
    try {
      response = await fetch(`${creds.url}/api/generate`, {
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      // A wrong or unreachable gateway address throws a bare "fetch failed",
      // which would surface as an unexplained 500. Name the address instead:
      // it is almost always the thing that needs fixing.
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(`LLM Gateway unreachable at ${creds.url}: ${reason}`);
      throw new ServiceUnavailableException(
        `Could not reach the LLM Gateway at ${creds.url}. Check the URL in Settings and that the gateway is running.`,
      );
    }

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      this.logger.error(`LLM Gateway error ${response.status}: ${error}`);

      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'The LLM Gateway rejected the API key. Check it in Settings.',
        );
      }
      throw new ServiceUnavailableException(
        `The LLM Gateway returned ${response.status}. ${
          options.freeOnly
            ? ''
            : 'Per-stock analysis needs a paid provider enabled on the gateway.'
        }`.trim(),
      );
    }

    const data = (await response.json()) as Partial<LlmResult>;
    return {
      text: data.text ?? '',
      provider: data.provider ?? 'unknown',
      model: data.model ?? 'unknown',
    };
  }
}
