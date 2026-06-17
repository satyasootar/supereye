'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Circle } from 'lucide-react';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { StatCard } from '@/components/admin/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatTokens, downloadCsv } from '@/lib/billing/format';
import { formatDuration } from '@/lib/monitoring/format';
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
  isOnline: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  currentSessionStartedAt: string | null;
  currentSessionSeconds: number;
  totalTimeSpentSeconds: number;
  aiTokensUsed: number;
};

type UsersResponse = {
  users: UserRow[];
  summary: {
    onlineNow: number;
    totalUsers: number;
    activeToday: number;
    totalTokensUsedThisPeriod: number;
  };
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tokenAmount, setTokenAmount] = useState('10000');
  const [tokenReason, setTokenReason] = useState('Admin allocation');
  const queryClient = useQueryClient();

  const { data, isLoading, dataUpdatedAt } = useQuery<UsersResponse>({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
    refetchInterval: 30_000,
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
  const summary = data?.summary;

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Manage accounts, monitor live activity, and adjust token balances. Refreshes every 30 seconds."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {dataUpdatedAt ? (
              <p className="text-xs text-text-muted">
                Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  'users.csv',
                  [
                    [
                      'Name',
                      'Email',
                      'Role',
                      'Plan',
                      'Online',
                      'Last login',
                      'Total time',
                      'Balance',
                      'Used',
                      'AI tokens',
                      'Status',
                      'Joined',
                    ],
                    ...users.map((u) => [
                      u.name ?? '',
                      u.email ?? '',
                      u.role,
                      u.planName ?? '',
                      u.isOnline ? 'yes' : 'no',
                      u.lastLoginAt ?? '',
                      String(u.totalTimeSpentSeconds),
                      String(u.balance ?? 0),
                      String(u.usedThisPeriod ?? 0),
                      String(u.aiTokensUsed),
                      u.status,
                      formatDate(u.createdAt),
                    ]),
                  ]
                )
              }
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Online now" value={summary.onlineNow} icon={Circle} accent="green" />
          <StatCard label="Active today" value={summary.activeToday} icon={Activity} accent="blue" />
          <StatCard label="Total users" value={summary.totalUsers} icon={Activity} />
          <StatCard
            label="Credits used (all users)"
            value={formatTokens(summary.totalTokensUsedThisPeriod)}
            icon={Activity}
          />
        </div>
      )}

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
            { key: 'user', label: 'User' },
            { key: 'presence', label: 'Presence' },
            { key: 'role', label: 'Role' },
            { key: 'plan', label: 'Plan' },
            { key: 'tokens', label: 'Tokens' },
            { key: 'lastLogin', label: 'Last login' },
            { key: 'time', label: 'Time in app' },
            { key: 'usage', label: 'Usage' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: 'Actions' },
          ]}
          rows={users.map((u) => ({
            user: (
              <div>
                <p className="font-medium text-text-primary">{u.name ?? 'Unnamed'}</p>
                <p className="text-xs text-text-muted">{u.email ?? '—'}</p>
              </div>
            ),
            presence: (
              <div className="flex flex-col gap-1">
                <Badge
                  variant={u.isOnline ? 'default' : 'outline'}
                  className={
                    u.isOnline
                      ? 'w-fit bg-[color:var(--priority-normal)] text-text-inverse'
                      : 'w-fit'
                  }
                >
                  {u.isOnline ? 'Online' : 'Offline'}
                </Badge>
                <span className="text-xs text-text-muted">
                  {u.isOnline
                    ? `${formatDuration(u.currentSessionSeconds)} this session`
                    : `Last seen ${formatDateTime(u.lastSeenAt)}`}
                </span>
              </div>
            ),
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
            lastLogin: formatDateTime(u.lastLoginAt),
            time: formatDuration(u.totalTimeSpentSeconds),
            usage: (
              <div className="text-xs">
                <p>{formatTokens(u.usedThisPeriod ?? 0)} credits</p>
                <p className="text-text-muted">{formatTokens(u.aiTokensUsed)} AI</p>
              </div>
            ),
            status: (
              <Badge variant={u.status === 'active' ? 'default' : 'outline'}>{u.status}</Badge>
            ),
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
                <p className="text-text-muted">Presence</p>
                <p>{selected.isOnline ? 'Online now' : 'Offline'}</p>
                <p className="text-text-muted">Last login</p>
                <p>{formatDateTime(selected.lastLoginAt)}</p>
                <p className="text-text-muted">Last seen</p>
                <p>{formatDateTime(selected.lastSeenAt)}</p>
                <p className="text-text-muted">Total time in app</p>
                <p>{formatDuration(selected.totalTimeSpentSeconds)}</p>
                <p className="text-text-muted">Credits used</p>
                <p>{formatTokens(selected.usedThisPeriod ?? 0)}</p>
                <p className="text-text-muted">AI tokens used</p>
                <p>{formatTokens(selected.aiTokensUsed)}</p>
                <p className="text-text-muted">Joined</p>
                <p>{formatDate(selected.createdAt)}</p>
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
