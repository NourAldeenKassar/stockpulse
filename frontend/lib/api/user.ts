import { request } from '../http';
import type { LlmSettings } from '../types';

export function getLlmSettings(): Promise<LlmSettings> {
  return request('/user/llm-settings');
}

export function updateLlmSettings(data: {
  llmGatewayUrl?: string;
  llmGatewayKey?: string;
  finnhubKey?: string;
  llmPremiumGatewayUrl?: string;
  llmPremiumKey?: string;
}): Promise<LlmSettings> {
  return request('/user/llm-settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
