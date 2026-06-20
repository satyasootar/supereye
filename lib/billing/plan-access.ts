import type { plans } from '@/lib/db/schema';

type PlanRow = typeof plans.$inferSelect;

/** Whether a plan includes AI features (chat, triage, summaries, etc.) */
export function planIncludesAi(
  plan: Pick<PlanRow, 'featureFlags' | 'monthlyTokens' | 'slug'> | null | undefined
): boolean {
  if (!plan) return true;

  const flags = (plan.featureFlags ?? {}) as Record<string, boolean>;

  if (flags.ai_enabled === false || flags.plugins_only === true) {
    return false;
  }

  // Free / plugins-only tier: no AI even if flags are missing on legacy rows
  if (plan.slug === 'free') {
    return false;
  }

  return true;
}

/** Human-readable plan capability label */
export function planAiLabel(
  plan: Pick<PlanRow, 'featureFlags' | 'monthlyTokens' | 'slug'> | null | undefined
): string {
  return planIncludesAi(plan) ? 'AI included' : 'Plugins only (no AI)';
}
