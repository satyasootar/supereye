import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { resolveProvider } from '@/lib/agent/model';

export function getTriageModel(): LanguageModel {
  const provider = resolveProvider();

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const openai = createOpenAI({ apiKey });
    const modelId = process.env.TRIAGE_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
    return openai(modelId);
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }
  const mistral = createMistral({ apiKey });
  const modelId = process.env.TRIAGE_MODEL ?? process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
  return mistral(modelId);
}
