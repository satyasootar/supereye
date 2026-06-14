import { db } from '@/lib/db';
import { aiUsageEvents } from '@/lib/db/schema';

export type UsageFeature =
  | 'chat'
  | 'chat_summary'
  | 'email_triage'
  | 'transcribe'
  | 'agent_email_send';

type RawUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
};

export function normalizeUsage(usage?: RawUsage | null) {
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
  const inputTokens = usage.inputTokens ?? usage.promptTokens ?? 0;
  const outputTokens = usage.outputTokens ?? usage.completionTokens ?? 0;
  const totalTokens = usage.totalTokens ?? inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

export async function logAiUsage(
  userId: string,
  data: {
    feature: UsageFeature;
    model?: string;
    usage?: RawUsage | null;
    metadata?: Record<string, unknown>;
  }
) {
  const tokens = normalizeUsage(data.usage);
  try {
    await db.insert(aiUsageEvents).values({
      userId,
      feature: data.feature,
      model: data.model ?? null,
      inputTokens: tokens.inputTokens,
      outputTokens: tokens.outputTokens,
      totalTokens: tokens.totalTokens,
      metadata: data.metadata ?? null,
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
}
