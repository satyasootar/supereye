'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatTokens, downloadCsv } from '@/lib/billing/format';
import { Badge } from '@/components/ui/badge';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastActiveAt: string | null;
  balance: number | null;
  usedThisPeriod: number | null;
  planName: string | null;
  subscriptionStatus: string | null;
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tokenAmount, setTokenAmount] = useState('10000');
  const [tokenReason, setTokenReason] = useState('Admin allocation');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ users: UserRow[] }>({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/users/${selected?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const tokenMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/users/${selected?.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Token action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users = data?.users ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Manage accounts, roles, plans, and token balances."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                'users.csv',
                [
                  ['Name', 'Email', 'Role', 'Plan', 'Balance', 'Used', 'Status', 'Joined'],
                  ...users.map((u) => [
                    u.name ?? '',
                    u.email ?? '',
                    u.role,
                    u.planName ?? '',
                    String(u.balance ?? 0),
                    String(u.usedThisPeriod ?? 0),
                    u.status,
                    formatDate(u.createdAt),
                  ]),
                ]
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading users…</p>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'plan', label: 'Plan' },
            { key: 'tokens', label: 'Tokens' },
            { key: 'status', label: 'Status' },
            { key: 'joined', label: 'Joined' },
            { key: 'actions', label: 'Actions' },
          ]}
          rows={users.map((u) => ({
            name: u.name ?? '—',
            email: u.email ?? '—',
            role: <Badge variant="outline">{u.role}</Badge>,
            plan: u.planName ?? '—',
            tokens: (
              <span>
                {formatTokens(u.balance ?? 0)}
                <span className="ml-1 text-text-muted">
                  / {formatTokens((u.balance ?? 0) + (u.usedThisPeriod ?? 0))}
                </span>
              </span>
            ),
            status: (
              <Badge variant={u.status === 'active' ? 'default' : 'outline'}>{u.status}</Badge>
            ),
            joined: formatDate(u.createdAt),
            actions: (
              <Button size="sm" variant="ghost" onClick={() => setSelected(u)}>
                Manage
              </Button>
            ),
          }))}
        />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <AdminPanel title={`Manage ${selected.email}`} className="max-h-[90vh] w-full max-w-lg overflow-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-text-muted">Role</p>
                <p>{selected.role}</p>
                <p className="text-text-muted">Plan</p>
                <p>{selected.planName ?? '—'}</p>
                <p className="text-text-muted">Balance</p>
                <p>{formatTokens(selected.balance ?? 0)}</p>
                <p className="text-text-muted">Last active</p>
                <p>{formatDate(selected.lastActiveAt)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actionMutation.mutate({ action: 'suspend' })}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actionMutation.mutate({ action: 'activate' })}
                  >
                    Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actionMutation.mutate({ role: 'enterprise_user' })}
                >
                  Set Enterprise
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actionMutation.mutate({ role: 'user' })}
                >
                  Set User
                </Button>
              </div>

              <div className="space-y-2 border-t border-border-subtle pt-4">
                <p className="text-sm font-medium">Token actions</p>
                <Input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="Amount"
                />
                <Input
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  placeholder="Reason"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      tokenMutation.mutate({
                        action: 'add',
                        amount: Number(tokenAmount),
                        reason: tokenReason,
                      })
                    }
                  >
                    Add Tokens
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      tokenMutation.mutate({
                        action: 'remove',
                        amount: Number(tokenAmount),
                        reason: tokenReason,
                      })
                    }
                  >
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      tokenMutation.mutate({
                        action: 'bonus',
                        amount: Number(tokenAmount),
                        reason: tokenReason,
                      })
                    }
                  >
                    Bonus
                  </Button>
                </div>
              </div>

              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
