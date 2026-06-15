'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { SimpleBarChart, SimpleLineChart } from '@/components/admin/simple-bar-chart';
import { formatCurrency, formatTokens } from '@/lib/billing/format';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm text-text-muted">Loading analytics…</p>;
  }

  const { charts, planAnalytics } = data;

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Growth, revenue, plan distribution, and token consumption trends."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="User Growth">
          <SimpleLineChart
            data={charts.userGrowth.map((d: { day: string; value: number }) => ({
              label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.value,
            }))}
          />
        </AdminPanel>
        <AdminPanel title="Revenue Growth">
          <SimpleLineChart
            data={charts.revenueGrowth.map((d: { day: string; value: number }) => ({
              label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.value / 100,
            }))}
          />
        </AdminPanel>
        <AdminPanel title="Token Consumption">
          <SimpleLineChart
            data={charts.tokenConsumption.map((d: { day: string; value: number }) => ({
              label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.value,
            }))}
          />
        </AdminPanel>
        <AdminPanel title="Daily AI Usage">
          <SimpleBarChart
            data={charts.dailyAiUsage.slice(-14).map((d: { day: string; value: number }) => ({
              label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: d.value,
            }))}
          />
        </AdminPanel>
      </div>

      <div className="mt-6">
        <AdminPanel title="Plan Analytics">
          <div className="grid gap-4 md:grid-cols-3">
            {planAnalytics.map(
              (p: {
                plan: { name: string };
                userCount: number;
                revenueCents: number;
                monthlyTokens: number;
              }) => (
                <div
                  key={p.plan.name}
                  className="rounded-lg border border-border-subtle bg-bg-surface p-4 text-sm"
                >
                  <h3 className="font-medium">{p.plan.name}</h3>
                  <p className="mt-2 text-text-muted">Users: {p.userCount}</p>
                  <p className="text-text-muted">Revenue: {formatCurrency(p.revenueCents)}</p>
                  <p className="text-text-muted">
                    Token allocation: {formatTokens(p.monthlyTokens)}
                  </p>
                </div>
              )
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
