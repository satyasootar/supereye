'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Circle } from 'lucide-react';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { StatCard } from '@/components/admin/stat-card';
import { Badge } from '@/components/ui/badge';
import { formatTokens } from '@/lib/billing/format';
import { formatDuration } from '@/lib/monitoring/format';

type MonitoringUser = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  currentSessionStartedAt: string | null;
  currentSessionSeconds: number;
  totalTimeSpentSeconds: number;
  tokensUsedThisPeriod: number;
  aiTokensUsed: number;
};

type MonitoringResponse = {
  users: MonitoringUser[];
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

export default function AdminMonitoringPage() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery<MonitoringResponse>({
    queryKey: ['admin-monitoring'],
    queryFn: async () => {
      const res = await fetch('/api/admin/monitoring');
      if (!res.ok) throw new Error('Failed to load monitoring data');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading monitoring…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-[color:var(--priority-urgent)]">
        Failed to load monitoring data.
      </p>
    );
  }

  const { users, summary } = data;

  return (
    <div>
      <AdminPageHeader
        title="User monitoring"
        description="Live presence, login history, time in app, and token usage per user. Refreshes every 30 seconds."
        actions={
          <p className="text-xs text-text-muted">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>
        }
      />

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

      <AdminPanel title="All users">
        <DataTable
          columns={[
            { key: 'user', label: 'User' },
            { key: 'status', label: 'Presence' },
            { key: 'lastLogin', label: 'Last login' },
            { key: 'session', label: 'Current session' },
            { key: 'totalTime', label: 'Total time in app' },
            { key: 'tokens', label: 'Credits used' },
            { key: 'aiTokens', label: 'AI tokens' },
          ]}
          rows={users.map((user) => ({
            user: (
              <div>
                <p className="font-medium text-text-primary">{user.name ?? 'Unnamed'}</p>
                <p className="text-xs text-text-muted">{user.email ?? user.id}</p>
              </div>
            ),
            status: (
              <div className="flex flex-col gap-1">
                <Badge
                  variant={user.isOnline ? 'default' : 'outline'}
                  className={
                    user.isOnline
                      ? 'w-fit bg-[color:var(--priority-normal)] text-text-inverse'
                      : 'w-fit'
                  }
                >
                  {user.isOnline ? 'Online' : 'Offline'}
                </Badge>
                {user.status === 'suspended' && (
                  <Badge variant="outline" className="w-fit text-[color:var(--priority-urgent)]">
                    Suspended
                  </Badge>
                )}
                <span className="text-xs text-text-muted">
                  Last seen {formatDateTime(user.lastSeenAt)}
                </span>
              </div>
            ),
            lastLogin: formatDateTime(user.lastLoginAt),
            session: user.isOnline ? (
              <div>
                <p className="text-text-primary">{formatDuration(user.currentSessionSeconds)}</p>
                <p className="text-xs text-text-muted">
                  Since {formatDateTime(user.currentSessionStartedAt)}
                </p>
              </div>
            ) : (
              '—'
            ),
            totalTime: formatDuration(user.totalTimeSpentSeconds),
            tokens: formatTokens(user.tokensUsedThisPeriod),
            aiTokens: formatTokens(user.aiTokensUsed),
          }))}
          emptyMessage="No users to monitor yet."
        />
      </AdminPanel>
    </div>
  );
}
