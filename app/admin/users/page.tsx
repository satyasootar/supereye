'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Circle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-shell';
import { ManageUserDialog } from '@/components/admin/manage-user-dialog';
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
  monthlyAllocation: number | null;
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
  callerRole: string;
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const fresh = queryClient.getQueryData<UsersResponse>(['admin-users', search]);
      if (fresh && selected) {
        const updated = fresh.users.find((u) => u.id === selected.id);
        if (updated) setSelected(updated);
      }
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const fresh = queryClient.getQueryData<UsersResponse>(['admin-users', search]);
      if (fresh && selected) {
        const updated = fresh.users.find((u) => u.id === selected.id);
        if (updated) setSelected(updated);
      }
    },
  });

  const users = data?.users ?? [];
  const summary = data?.summary;
  const isSuperAdmin = data?.callerRole === 'super_admin';

  const canModifyUser = (user: UserRow) => {
    if (user.role === 'super_admin') return false;
    if (!isSuperAdmin && user.role === 'admin') return false;
    return true;
  };

  const selectedModifiable = selected ? canModifyUser(selected) : false;

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
            { key: 'tokens', label: 'Credits' },
            { key: 'lastLogin', label: 'Last login' },
            { key: 'time', label: 'Time in app' },
            ...(isSuperAdmin ? [{ key: 'usage', label: 'LLM tokens' as const }] : []),
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
              <span className="text-sm">
                {formatTokens(u.balance ?? 0)}
                <span className="ml-1 text-text-muted">
                  left · {formatTokens(u.usedThisPeriod ?? 0)} used
                </span>
              </span>
            ),
            lastLogin: formatDateTime(u.lastLoginAt),
            time: formatDuration(u.totalTimeSpentSeconds),
            ...(isSuperAdmin
              ? {
                  usage: (
                    <span className="text-xs tabular-nums text-text-secondary">
                      {formatTokens(u.aiTokensUsed)}
                    </span>
                  ),
                }
              : {}),
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
        <ManageUserDialog
          user={selected}
          isSuperAdmin={isSuperAdmin}
          canModify={selectedModifiable}
          isActionPending={actionMutation.isPending}
          isTokenPending={tokenMutation.isPending}
          onClose={() => setSelected(null)}
          onAction={(payload) => actionMutation.mutate(payload)}
          onTokenAction={(payload) => tokenMutation.mutate(payload)}
        />
      )}
    </div>
  );
}
