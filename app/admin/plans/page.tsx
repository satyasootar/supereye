'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatCredits } from '@/lib/billing/format';
import { planAiLabel } from '@/lib/billing/plan-access';
import { Badge } from '@/components/ui/badge';

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  monthlyTokens: number;
  isEnterprise: boolean;
  isActive: boolean;
  featureFlags: Record<string, boolean> | null;
  pluginLimit: number | null;
  teamMemberLimit: number | null;
};
  const [editing, setEditing] = useState<Plan | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ plans: Plan[] }>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await fetch('/api/admin/plans?all=1');
      if (!res.ok) throw new Error('Failed to load plans');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setEditing(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Create failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  const plans = data?.plans ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Plans"
        description="Configure subscription tiers, monthly credit allocations, and AI access."
        actions={
          <Button
            size="sm"
            onClick={() =>
              createMutation.mutate({
                name: 'Custom Enterprise',
                monthlyTokens: 5000000,
                priceCents: 0,
              })
            }
          >
            New Enterprise Plan
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading plans…</p>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Plan' },
            { key: 'price', label: 'Price' },
            { key: 'tokens', label: 'Monthly credits' },
            { key: 'ai', label: 'AI' },
            { key: 'limits', label: 'Limits' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '' },
          ]}
          rows={plans.map((p) => ({
            name: (
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-text-muted">{p.slug}</p>
              </div>
            ),
            price: p.isEnterprise ? 'Custom' : formatCurrency(p.priceCents),
            tokens: formatCredits(p.monthlyTokens),
            ai: (
              <Badge variant="outline" className="text-xs">
                {planAiLabel(p)}
              </Badge>
            ),
            limits: `${p.pluginLimit ?? '∞'} plugins · ${p.teamMemberLimit ?? '∞'} members`,
            status: (
              <Badge variant={p.isActive ? 'default' : 'outline'}>
                {p.isActive ? 'Active' : 'Inactive'}
              </Badge>
            ),
            actions: (
              <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                Edit
              </Button>
            ),
          }))}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <AdminPanel title={`Edit ${editing.name}`} className="w-full max-w-md">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const aiEnabled = fd.get('aiEnabled') === 'on';
                updateMutation.mutate({
                  planId: editing.id,
                  name: fd.get('name'),
                  priceCents: Number(fd.get('priceCents')),
                  monthlyTokens: Number(fd.get('monthlyTokens')),
                  pluginLimit: Number(fd.get('pluginLimit')) || null,
                  teamMemberLimit: Number(fd.get('teamMemberLimit')) || null,
                  featureFlags: {
                    ...(editing.featureFlags ?? {}),
                    ai_enabled: aiEnabled,
                    plugins_only: !aiEnabled,
                  },
                });
              }}
            >
              <Input name="name" defaultValue={editing.name} placeholder="Name" />
              <Input
                name="priceCents"
                type="number"
                defaultValue={editing.priceCents}
                placeholder="Price (cents)"
              />
              <Input
                name="monthlyTokens"
                type="number"
                defaultValue={editing.monthlyTokens}
                placeholder="Monthly credits"
              />
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  name="aiEnabled"
                  defaultChecked={
                    editing.featureFlags?.ai_enabled !== false &&
                    editing.slug !== 'free'
                  }
                  className="rounded border-border-default"
                />
                Include AI features (chat, triage, summaries)
              </label>
              <Input
                name="pluginLimit"
                type="number"
                defaultValue={editing.pluginLimit ?? ''}
                placeholder="Plugin limit"
              />
              <Input
                name="teamMemberLimit"
                type="number"
                defaultValue={editing.teamMemberLimit ?? ''}
                placeholder="Team member limit"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
