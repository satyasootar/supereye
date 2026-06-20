'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatTokens, formatDate } from '@/lib/billing/format';

type TokenCost = {
  id: string;
  actionKey: string;
  displayName: string;
  tokenCost: number;
  isActive: boolean;
};

type TopUpPack = {
  id: string;
  name: string;
  tokenAmount: number;
  priceCents: number;
  isActive: boolean;
};

type LedgerRow = {
  entry: {
    action: string;
    tokensAdded: number;
    tokensRemoved: number;
    previousBalance: number;
    newBalance: number;
    reason: string | null;
    createdAt: string;
  };
  userEmail: string | null;
};

export default function AdminTokensPage() {
  const [tab, setTab] = useState<'costs' | 'packs' | 'ledger'>('costs');
  const queryClient = useQueryClient();

  const costsQuery = useQuery<{ costs: TokenCost[] }>({
    queryKey: ['admin-token-costs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tokens');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: tab === 'costs',
  });

  const packsQuery = useQuery<{ packs: TopUpPack[] }>({
    queryKey: ['admin-token-packs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tokens?type=packs');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: tab === 'packs',
  });

  const ledgerQuery = useQuery<{ ledger: LedgerRow[] }>({
    queryKey: ['admin-token-ledger'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tokens?type=ledger');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: tab === 'ledger',
  });

  const patchMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/tokens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-token-costs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-token-packs'] });
    },
  });

  return (
    <div>
      <AdminPageHeader
        title="Tokens"
        description="Configure AI action credit costs, top-up packs, and view the credit ledger."
      />

      <div className="mb-4 flex gap-2">
        {(['costs', 'packs', 'ledger'] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? 'default' : 'outline'}
            onClick={() => setTab(t)}
          >
            {t === 'costs' ? 'Action Costs' : t === 'packs' ? 'Top-up Packs' : 'Ledger'}
          </Button>
        ))}
      </div>

      {tab === 'costs' && (
        <DataTable
          columns={[
            { key: 'action', label: 'Action' },
            { key: 'key', label: 'Key' },
            { key: 'cost', label: 'Credit cost' },
            { key: 'edit', label: '' },
          ]}
          rows={(costsQuery.data?.costs ?? []).map((c) => ({
            action: c.displayName,
            key: c.actionKey,
            cost: formatTokens(c.tokenCost),
            edit: (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = prompt('New token cost', String(c.tokenCost));
                  if (next) {
                    patchMutation.mutate({ id: c.id, tokenCost: Number(next) });
                  }
                }}
              >
                Edit
              </Button>
            ),
          }))}
        />
      )}

      {tab === 'packs' && (
        <DataTable
          columns={[
            { key: 'name', label: 'Pack' },
            { key: 'tokens', label: 'Tokens' },
            { key: 'price', label: 'Price' },
            { key: 'edit', label: '' },
          ]}
          rows={(packsQuery.data?.packs ?? []).map((p) => ({
            name: p.name,
            tokens: formatTokens(p.tokenAmount),
            price: formatCurrency(p.priceCents),
            edit: (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = prompt('New price (cents)', String(p.priceCents));
                  if (next) {
                    patchMutation.mutate({ type: 'pack', id: p.id, priceCents: Number(next) });
                  }
                }}
              >
                Edit Price
              </Button>
            ),
          }))}
        />
      )}

      {tab === 'ledger' && (
        <DataTable
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'delta', label: 'Change' },
            { key: 'balance', label: 'Balance' },
            { key: 'reason', label: 'Reason' },
          ]}
          rows={(ledgerQuery.data?.ledger ?? []).map((r) => ({
            date: formatDate(r.entry.createdAt),
            user: r.userEmail ?? '—',
            action: r.entry.action,
            delta:
              r.entry.tokensAdded > 0
                ? `+${formatTokens(r.entry.tokensAdded)}`
                : `-${formatTokens(r.entry.tokensRemoved)}`,
            balance: formatTokens(r.entry.newBalance),
            reason: r.entry.reason ?? '—',
          }))}
        />
      )}
    </div>
  );
}
