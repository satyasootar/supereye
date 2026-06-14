import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type AgentProvider = 'mistral' | 'openai';

function resolveProvider(): AgentProvider {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  if (configured === 'openai' || configured === 'mistral') {
    return configured;
  }
  if (process.env.OPENAI_API_KEY && !process.env.MISTRAL_API_KEY) {
    return 'openai';
  }
  return 'mistral';
}

export function getAgentModel(): LanguageModel {
  const provider = resolveProvider();

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const openai = createOpenAI({ apiKey });
    const modelId = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
    return openai(modelId);
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }
  const mistral = createMistral({ apiKey });
  const modelId = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
  return mistral(modelId);
}

export function getAgentProviderLabel(): string {
  return resolveProvider() === 'openai' ? 'OpenAI' : 'Mistral';
}

export function assertAgentConfigured(): void {
  getAgentModel();
}
