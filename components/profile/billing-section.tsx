'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatTokens } from '@/lib/billing/format';

type WalletResponse = {
  wallet: {
    balance: number;
    monthlyAllocation: number;
    usedThisPeriod: number;
    unlimited: boolean;
    periodEnd: string | null;
  } | null;
  subscription: {
    subscription: { status: string; currentPeriodEnd: string };
    plan: { name: string; priceCents: number; monthlyTokens: number };
  } | null;
  packs: { id: string; name: string; tokenAmount: number; priceCents: number }[];
  role: string;
};

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

  const purchaseMutation = useMutation({
    mutationFn: async (packId: string) => {
      const res = await fetch('/api/billing/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Purchase failed');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-wallet'] }),
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
  const isUnlimited = role === 'super_admin' || wallet?.unlimited;
  const used = wallet?.usedThisPeriod ?? 0;
  const allocation = wallet?.monthlyAllocation ?? 0;
  const pct = allocation > 0 ? Math.min(100, Math.round((used / allocation) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
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

      <ProfileSection
        title="Token balance"
        description="AI features consume tokens from your monthly allocation."
      >
        {isUnlimited ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-4 py-3 text-sm text-accent-blue">
            <Sparkles className="h-4 w-4" />
            Unlimited AI usage
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border-default bg-bg-elevated p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-text-muted" />
                  <span className="text-2xl font-semibold text-text-primary">
                    {formatTokens(wallet?.balance ?? 0)}
                  </span>
                  <span className="text-sm text-text-muted">remaining</span>
                </div>
                <span className="text-sm text-text-muted">
                  {formatTokens(used)} used of {formatTokens(allocation)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-surface">
                <div
                  className="h-full rounded-full bg-accent-blue transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {(wallet?.balance ?? 0) === 0 && (
                <p className="mt-3 text-sm text-amber-600">
                  Your monthly token limit has been exhausted. Purchase a top-up pack below or
                  contact support to upgrade.
                </p>
              )}
            </div>
          </>
        )}
      </ProfileSection>

      {!isUnlimited && packs.length > 0 && (
        <ProfileSection
          title="Buy tokens"
          description="One-time token packs are added to your balance immediately."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="rounded-lg border border-border-default bg-bg-elevated p-4"
              >
                <p className="font-medium text-text-primary">{pack.name}</p>
                <p className="mt-1 text-sm text-text-muted">{formatCurrency(pack.priceCents)}</p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  disabled={purchaseMutation.isPending}
                  onClick={() => purchaseMutation.mutate(pack.id)}
                >
                  {purchaseMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </div>
            ))}
          </div>
          {purchaseMutation.isError && (
            <p className="mt-2 text-sm text-[color:var(--priority-urgent)]">
              {purchaseMutation.error.message}
            </p>
          )}
        </ProfileSection>
      )}
    </div>
  );
}
