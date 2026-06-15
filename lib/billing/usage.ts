import { logAiUsage, type UsageFeature, normalizeUsage } from '@/lib/usage/log-usage';
import { consumeTokens, assertCanUseAi } from '@/lib/billing/tokens';
import { USAGE_FEATURE_TO_ACTION } from '@/lib/billing/constants';

export { assertCanUseAi, TokenExhaustedError } from '@/lib/billing/tokens';

export async function checkAiAccess(userId: string) {
  await assertCanUseAi(userId);
}

export async function logAndConsumeAiUsage(
  userId: string,
  data: {
    feature: UsageFeature;
    model?: string;
    usage?: Parameters<typeof normalizeUsage>[0];
    metadata?: Record<string, unknown>;
  }
) {
  await logAiUsage(userId, data);

  const actionKey = USAGE_FEATURE_TO_ACTION[data.feature] ?? `ai_${data.feature}`;
  await consumeTokens({
    userId,
    actionKey,
    reason: `Usage: ${data.feature}`,
    referenceType: 'usage_feature',
    referenceId: data.feature,
    metadata: {
      model: data.model,
      ...data.metadata,
      llmTokens: normalizeUsage(data.usage),
    },
  });
}
