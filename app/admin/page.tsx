'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  DollarSign,
  Bot,
  Coins,
  Building2,
  CreditCard,
  Activity,
  Inbox,
} from 'lucide-react';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { StatCard } from '@/components/admin/stat-card';
import { SimpleBarChart, SimpleLineChart, toDayChartData } from '@/components/admin/simple-bar-chart';
import { AdminTokenUsageCharts } from '@/components/admin/token-usage-charts';
import { formatCurrency, formatTokens, formatDateTime } from '@/lib/billing/format';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type OverviewResponse = {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalRevenueCents: number;
    monthlyRevenueCents: number;
    totalAiRequests: number;
    totalTokensConsumed: number;
    enterpriseCustomers: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
  };
  planAnalytics: {
    plan: { name: string; slug: string };
    userCount: number;
    revenueCents: number;
    monthlyTokens: number;
  }[];
  charts: {
    userGrowth: { day: string; value: number }[];
    revenueGrowth: { day: string; value: number }[];
    planDistribution: { label: string; value: number }[];
    tokenConsumption: { day: string; value: number }[];
    llmTokenUsage: { day: string; value: number }[];
    billingCredits: { day: string; value: number }[];
    dailyAiUsage: { day: string; value: number }[];
    tokenByFeature: { label: string; value: number; requests?: number }[];
  };
  pendingRequestsCount: number;
  pendingRequests: {
    id: string;
    type: 'credit_top_up' | 'subscription_change';
    userEmail: string | null;
    userName: string | null;
    packName: string | null;
    planName: string | null;
    currentPlanName: string | null;
    createdAt: string;
  }[];
};

export default function AdminOverviewPage() {
  const { data, isLoading, error } = useQuery<OverviewResponse>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed to load overview');
      return res.json();
    },
  });

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading dashboard…</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-[color:var(--priority-urgent)]">Failed to load dashboard.</p>;
  }

  const { overview, planAnalytics, charts, pendingRequestsCount, pendingRequests } = data;

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Platform health, growth, revenue, plan analytics, and AI usage in one place."
      />

      {pendingRequestsCount > 0 && (
        <AdminPanel title="Pending billing requests" className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {pendingRequestsCount} request{pendingRequestsCount === 1 ? '' : 's'} awaiting
              approval.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/requests">View all requests</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {request.userName?.trim() || request.userEmail || 'Unknown user'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {request.type === 'credit_top_up'
                      ? `Credit top-up · ${request.packName ?? 'Pack'}`
                      : `Plan change · ${request.currentPlanName ?? 'Current'} → ${request.planName ?? 'Requested'}`}
                    {' · '}
                    {formatDateTime(request.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            ))}
          </div>
        </AdminPanel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={overview.totalUsers} icon={Users} accent="blue" />
        <StatCard label="Active Users (30d)" value={overview.activeUsers} icon={Activity} />
        <StatCard label="New Users (30d)" value={overview.newUsers} icon={UserPlus} accent="green" />
        <StatCard
          label="Pending Requests"
          value={pendingRequestsCount}
          icon={Inbox}
          accent={pendingRequestsCount > 0 ? 'green' : undefined}
          hint="Credit & plan changes"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(overview.monthlyRevenueCents)}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(overview.totalRevenueCents)}
          icon={DollarSign}
        />
        <StatCard label="AI Requests" value={overview.totalAiRequests} icon={Bot} accent="blue" />
        <StatCard
          label="Tokens Consumed"
          value={formatTokens(overview.totalTokensConsumed)}
          icon={Coins}
        />
        <StatCard
          label="Active Subscriptions"
          value={overview.activeSubscriptions}
          icon={CreditCard}
          hint={`${overview.expiredSubscriptions} expired`}
        />
      </div>

      <div className="mt-6">
        <AdminTokenUsageCharts charts={charts} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="User Growth (30 days)">
          <SimpleLineChart
            data={toDayChartData(charts.userGrowth)}
            showWhenZero={false}
            emptyMessage="No new users in the last 30 days."
          />
        </AdminPanel>
        <AdminPanel title="Revenue Growth (30 days)">
          <SimpleLineChart
            data={toDayChartData(charts.revenueGrowth).map((d) => ({
              ...d,
              value: d.value / 100,
            }))}
            showWhenZero={false}
            emptyMessage="No paid revenue in the last 30 days."
          />
        </AdminPanel>
        <AdminPanel title="Plan Distribution">
          <SimpleBarChart
            data={charts.planDistribution}
            emptyMessage="No active subscriptions yet."
          />
        </AdminPanel>
      </div>

      <div className="mt-6">
        <AdminPanel title="Plan Breakdown">
          <div className="grid gap-4 md:grid-cols-3">
            {planAnalytics.map((p) => (
              <div
                key={p.plan.slug}
                className="rounded-lg border border-border-subtle bg-bg-surface p-4"
              >
                <div className="flex items-center gap-2">
                  {p.plan.slug === 'enterprise' && <Building2 className="h-4 w-4 text-text-muted" />}
                  <h3 className="font-medium text-text-primary">{p.plan.name}</h3>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Users</dt>
                    <dd className="font-medium">{p.userCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Revenue</dt>
                    <dd className="font-medium">{formatCurrency(p.revenueCents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Monthly tokens</dt>
                    <dd className="font-medium">{formatTokens(p.monthlyTokens)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
