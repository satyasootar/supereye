import { getUserSubscription, ensureUserHasSubscription } from '@/lib/billing/admin';
import { getTokenWallet } from '@/lib/billing/tokens';
import { getUserRole } from '@/lib/billing/rbac';
import { hasUnlimitedAiAccess } from '@/lib/billing/constants';
import { formatCurrency, formatDate, formatTokens } from '@/lib/billing/format';

export type AgentAccountSummary = {
  role: string;
  planName: string;
  planSlug: string | null;
  subscriptionStatus: string | null;
  renewsAt: string | null;
  priceLabel: string;
  monthlyTokens: number | null;
  tokensRemaining: number | null;
  tokensUsedThisPeriod: number | null;
  monthlyAllocation: number | null;
  unlimited: boolean;
  periodEnd: string | null;
  billingHint: string;
};

export async function getAccountSummaryForAgent(
  userId: string
): Promise<AgentAccountSummary> {
  await ensureUserHasSubscription(userId);

  const [wallet, subscription, role] = await Promise.all([
    getTokenWallet(userId),
    getUserSubscription(userId),
    getUserRole(userId),
  ]);

  const plan = subscription?.plan;
  const unlimited = hasUnlimitedAiAccess(role) || !!wallet?.unlimited;

  return {
    role,
    planName: plan?.name ?? 'No active plan',
    planSlug: plan?.slug ?? null,
    subscriptionStatus: subscription?.subscription.status ?? null,
    renewsAt: subscription?.subscription.currentPeriodEnd
      ? formatDate(subscription.subscription.currentPeriodEnd)
      : null,
    priceLabel: plan ? formatCurrency(plan.priceCents) : '—',
    monthlyTokens: plan?.monthlyTokens ?? null,
    tokensRemaining: wallet?.balance ?? null,
    tokensUsedThisPeriod: wallet?.usedThisPeriod ?? null,
    monthlyAllocation: wallet?.monthlyAllocation ?? null,
    unlimited,
    periodEnd: wallet?.periodEnd ? formatDate(wallet.periodEnd) : null,
    billingHint: 'Profile → Billing',
  };
}

export function formatAccountSummaryForPrompt(summary: AgentAccountSummary): string {
  const lines = [
    `Plan: **${summary.planName}**${summary.planSlug ? ` (${summary.planSlug})` : ''}`,
    `Price: ${summary.priceLabel}/month`,
    `Subscription status: ${summary.subscriptionStatus ?? 'none'}`,
  ];

  if (summary.renewsAt) {
    lines.push(`Renews: ${summary.renewsAt}`);
  }

  if (summary.unlimited) {
    lines.push('AI tokens: **Unlimited**');
  } else if (summary.monthlyAllocation != null) {
    lines.push(
      `AI tokens this period: ${formatTokens(summary.tokensUsedThisPeriod)} used of ${formatTokens(summary.monthlyAllocation)} (${formatTokens(summary.tokensRemaining)} remaining)`
    );
  }

  if (summary.periodEnd) {
    lines.push(`Token period ends: ${summary.periodEnd}`);
  }

  lines.push(`Manage billing in **${summary.billingHint}**.`);
  return lines.join('\n');
}
