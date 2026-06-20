'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, CreditCard, Loader2, Mail, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCredits } from '@/lib/billing/format';
import { getWalletDisplayMetrics } from '@/lib/billing/wallet-math';
import { cn } from '@/lib/utils';
import {
  hasUnlimitedAiAccess,
  TOKEN_SUPPORT_EMAIL,
  TOKEN_SUPPORT_X_URL,
} from '@/lib/billing/constants';
import { planAiLabel } from '@/lib/billing/plan-access';

type WalletResponse = {
  wallet: {
    balance: number;
    monthlyAllocation: number;
    bonusAllocation?: number;
    usedThisPeriod: number;
    unlimited: boolean;
    periodEnd: string | null;
  } | null;
  subscription: {
    subscription: { status: string; currentPeriodEnd: string };
    plan: { id: string; name: string; priceCents: number; monthlyTokens: number };
  } | null;
  packs: { id: string; name: string; tokenAmount: number; priceCents: number }[];
  credits?: { aiEnabled: boolean; effectiveLimit: number; remainingAllowance: number } | null;
  role: string;
};

type PlanOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  monthlyTokens: number;
  featureFlags: Record<string, boolean> | null;
};

type BillingRequest = {
  id: string;
  type: 'credit_top_up' | 'subscription_change';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  packId: string | null;
  planId: string | null;
  packName: string | null;
  planName: string | null;
  createdAt: string;
};

function TokenSupportContact() {
  return (
    <div className="mt-3 rounded-lg border border-border-default bg-bg-surface p-4">
      <p className="text-sm font-medium text-text-primary">Need more credits?</p>
      <p className="mt-1 text-sm text-text-muted">
        Submit a credit request below or contact a super admin for help.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={`mailto:${TOKEN_SUPPORT_EMAIL}?subject=Token%20limit%20increase%20request`}>
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            {TOKEN_SUPPORT_EMAIL}
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={TOKEN_SUPPORT_X_URL} target="_blank" rel="noopener noreferrer">
            @satyasootar on X
          </a>
        </Button>
      </div>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: BillingRequest['status'] }) {
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending approval
      </Badge>
    );
  }
  if (status === 'approved') return <Badge>Approved</Badge>;
  if (status === 'rejected') return <Badge variant="secondary">Declined</Badge>;
  return null;
}

export function BillingSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<WalletResponse>({
    queryKey: ['billing-wallet'],
    queryFn: async () => {
      const res = await fetch('/api/billing/wallet');
      if (!res.ok) throw new Error('Failed to load billing');
      return res.json();
    },
  });

  const { data: plansData } = useQuery<{ plans: PlanOption[] }>({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const res = await fetch('/api/billing/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      return res.json();
    },
  });

  const { data: requestsData } = useQuery<{ requests: BillingRequest[] }>({
    queryKey: ['billing-requests'],
    queryFn: async () => {
      const res = await fetch('/api/billing/requests');
      if (!res.ok) throw new Error('Failed to load requests');
      return res.json();
    },
  });

  const creditRequestMutation = useMutation({
    mutationFn: async (packId: string) => {
      const res = await fetch('/api/billing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credit_top_up', packId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Request failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-requests'] });
    },
  });

  const planRequestMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Request failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-requests'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading billing…
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-text-muted">Unable to load billing information.</p>;
  }

  const { wallet, subscription, packs, role } = data;
  const isUnlimited = hasUnlimitedAiAccess(role) || wallet?.unlimited;
  const used = wallet?.usedThisPeriod ?? 0;
  const allocation = wallet?.monthlyAllocation ?? 0;
  const bonus = wallet?.bonusAllocation ?? 0;
  const walletMetrics = wallet
    ? getWalletDisplayMetrics({
        balance: wallet.balance,
        monthlyAllocation: allocation,
        bonusAllocation: bonus,
        usedThisPeriod: used,
      })
    : null;
  const effectiveLimit = data.credits?.effectiveLimit ?? walletMetrics?.effectiveLimit ?? 0;
  const remaining = data.credits?.remainingAllowance ?? walletMetrics?.remaining ?? 0;
  const pct = walletMetrics?.pct ?? 0;
  const isExhausted = !isUnlimited && remaining === 0;

  const requests = requestsData?.requests ?? [];
  const pendingCreditPackIds = new Set(
    requests
      .filter((r) => r.type === 'credit_top_up' && r.status === 'pending' && r.packId)
      .map((r) => r.packId!)
  );
  const pendingPlanIds = new Set(
    requests
      .filter((r) => r.type === 'subscription_change' && r.status === 'pending' && r.planId)
      .map((r) => r.planId!)
  );
  const currentPlanId = subscription?.plan.id;
  const availablePlans = (plansData?.plans ?? []).filter((plan) => plan.id !== currentPlanId);

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      {pendingRequests.length > 0 && (
        <ProfileSection
          title="Pending requests"
          description="These requests are waiting for admin approval."
        >
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border border-border-default bg-bg-elevated px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {request.type === 'credit_top_up'
                      ? `Credit request · ${request.packName ?? 'Pack'}`
                      : `Plan change · ${request.planName ?? 'Plan'}`}
                  </p>
                  <p className="text-xs text-text-muted">
                    Submitted {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <RequestStatusBadge status={request.status} />
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      <ProfileSection
        title="Subscription"
        description="Your current plan and renewal details."
      >
        <ProfileRow label="Plan" description="Active subscription tier">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-text-muted" />
            <span className="text-[13px] font-medium text-text-primary">
              {subscription?.plan.name ?? 'Starter'}
            </span>
            {subscription?.subscription.status && (
              <Badge variant="outline">{subscription.subscription.status}</Badge>
            )}
          </div>
        </ProfileRow>
        {subscription?.plan && !subscription.plan.name.toLowerCase().includes('enterprise') && (
          <ProfileRow label="Monthly price">
            <span className="text-[13px] text-text-secondary">
              {formatCurrency(subscription.plan.priceCents)}/mo
            </span>
          </ProfileRow>
        )}
        {subscription?.subscription.currentPeriodEnd && (
          <ProfileRow label="Renews">
            <span className="text-[13px] text-text-secondary">
              {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </ProfileRow>
        )}
      </ProfileSection>

      {!isUnlimited && plansData?.plans && plansData.plans.length > 0 && (
        <ProfileSection
          title="Change subscription"
          description="Request a plan change. An admin will review and approve before your subscription is updated."
        >
          <div className="flex flex-col gap-3 w-full">
            {plansData.plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isPending = pendingPlanIds.has(plan.id);
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-lg border bg-bg-elevated p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full",
                    isCurrent ? "border-accent-blue/30 ring-1 ring-accent-blue/15" : "border-border-default"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">{plan.name}</p>
                      <Badge variant={isCurrent ? 'default' : 'outline'} className="text-[10px]">
                        {planAiLabel(plan)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      {formatCurrency(plan.priceCents)}/mo · {formatCredits(plan.monthlyTokens)} credits/mo
                    </p>
                    {plan.description && (
                      <p className="mt-1.5 text-xs text-text-muted">{plan.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 w-full sm:w-auto">
                    <Button
                      variant={isCurrent || isPending ? 'outline' : 'default'}
                      className={cn(
                        "w-full sm:w-48",
                        isCurrent && "border-accent-blue/30 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/10 disabled:opacity-100 cursor-default",
                        isPending && "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 disabled:opacity-100 cursor-default"
                      )}
                      disabled={isCurrent || isPending || planRequestMutation.isPending}
                      onClick={() => planRequestMutation.mutate(plan.id)}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Current plan
                        </>
                      ) : isPending ? (
                        <>
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          Request pending
                        </>
                      ) : planRequestMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Request plan change'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {planRequestMutation.isError && (
            <p className="mt-2 text-sm text-[color:var(--priority-urgent)]">
              {planRequestMutation.error.message}
            </p>
          )}
          {planRequestMutation.isSuccess && (
            <p className="mt-2 text-sm text-accent-blue">
              Plan change request submitted. You will receive an email once an admin reviews it.
            </p>
          )}
        </ProfileSection>
      )}

      <ProfileSection
        title="AI credits"
        description="AI features consume credits from your monthly plan allocation."
      >
        {isUnlimited ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-4 py-3 text-sm text-accent-blue">
            <Sparkles className="h-4 w-4" />
            Unlimited AI credits
          </div>
        ) : data.credits && !data.credits.aiEnabled ? (
          <div className="rounded-lg border border-border-default bg-bg-elevated p-4 text-sm text-text-muted">
            Your plan does not include AI features. Request a plan change above or purchase credits
            below.
            <TokenSupportContact />
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border-default bg-bg-elevated p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-text-muted" />
                  <span className="text-2xl font-semibold text-text-primary">
                    {formatCredits(remaining)}
                  </span>
                  <span className="text-sm text-text-muted">remaining</span>
                </div>
                <span className="text-sm text-text-muted">
                  {formatCredits(used)} used of {formatCredits(effectiveLimit)}
                </span>
              </div>
              {bonus > 0 && (
                <p className="mt-1 text-xs text-text-muted">
                  Includes {formatCredits(bonus)} bonus credits granted by admin
                </p>
              )}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-surface">
                <div
                  className="h-full rounded-full bg-accent-blue transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {isExhausted && (
                <p className="mt-3 text-sm text-amber-600">
                  Your AI credits for this period are exhausted. Request a credit pack below.
                </p>
              )}
            </div>
            <TokenSupportContact />
          </>
        )}
      </ProfileSection>

      {!isUnlimited && packs.length > 0 && (
        <ProfileSection
          title="Buy credits"
          description="Submit a credit request for admin approval. Credits are added to your account once approved."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {packs.map((pack) => {
              const isPending = pendingCreditPackIds.has(pack.id);
              return (
                <div
                  key={pack.id}
                  className="rounded-lg border border-border-default bg-bg-elevated p-4"
                >
                  <p className="font-medium text-text-primary">{pack.name}</p>
                  <p className="mt-1 text-sm text-text-muted">{formatCurrency(pack.priceCents)}</p>
                  <Button
                    variant={isPending ? 'outline' : 'default'}
                    className="mt-3 w-full"
                    disabled={isPending || creditRequestMutation.isPending}
                    onClick={() => creditRequestMutation.mutate(pack.id)}
                  >
                    {isPending ? (
                      <>
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        Request pending
                      </>
                    ) : creditRequestMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Request credits'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
          {creditRequestMutation.isError && (
            <p className="mt-2 text-sm text-[color:var(--priority-urgent)]">
              {creditRequestMutation.error.message}
            </p>
          )}
          {creditRequestMutation.isSuccess && (
            <p className="mt-2 text-sm text-accent-blue">
              Credit request submitted. You will receive an email once an admin reviews it.
            </p>
          )}
        </ProfileSection>
      )}
    </div>
  );
}
