'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AdminPanel } from '@/components/admin/admin-shell';
import { formatCredits } from '@/lib/billing/format';
import { planAiLabel } from '@/lib/billing/plan-access';

type SettingsResponse = {
  settings: {
    demoLoginEnabled: boolean;
    defaultSignupPlanId: string | null;
    updatedAt: string | null;
  };
  plans: {
    id: string;
    slug: string;
    name: string;
    monthlyTokens: number;
    featureFlags: Record<string, boolean> | null;
  }[];
  effectiveDefaultPlan: { id: string; slug: string; name: string } | null;
};

export function DefaultSignupPlanSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery<SettingsResponse>({
    queryKey: ['admin-platform-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (defaultSignupPlanId: string | null) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultSignupPlanId }),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json() as Promise<SettingsResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-settings'] });
    },
  });

  const plans = settingsQuery.data?.plans ?? [];
  const selectedId =
    settingsQuery.data?.settings.defaultSignupPlanId ??
    settingsQuery.data?.effectiveDefaultPlan?.id ??
    '';
  const effective = settingsQuery.data?.effectiveDefaultPlan;
  const isBusy = settingsQuery.isLoading || patchMutation.isPending;

  return (
    <AdminPanel title="New user default plan">
      <div className="space-y-3 text-sm">
        <p className="text-text-muted">
          Choose which plan new users receive on first sign-in. Change per-user plans anytime from
          Users → Manage.
        </p>

        <div className="relative">
          <select
            className="w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
            value={selectedId}
            disabled={isBusy}
            onChange={(e) => patchMutation.mutate(e.target.value || null)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {formatCredits(plan.monthlyTokens)} credits/mo ·{' '}
                {planAiLabel(plan)}
              </option>
            ))}
          </select>
          {isBusy && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            </span>
          )}
        </div>

        {effective && (
          <p className="text-xs text-text-muted">
            Active default: <span className="font-medium text-text-secondary">{effective.name}</span>{' '}
            ({effective.slug})
            {!settingsQuery.data?.settings.defaultSignupPlanId && ' — using Starter fallback'}
          </p>
        )}

        {patchMutation.isError && (
          <p className="text-destructive" role="alert">
            Could not save default plan.
          </p>
        )}
      </div>
    </AdminPanel>
  );
}
