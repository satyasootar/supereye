'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { SimpleLineChart, toDayChartData } from '@/components/admin/simple-bar-chart';
import { AdminTokenUsageCharts } from '@/components/admin/token-usage-charts';
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

      <AdminTokenUsageCharts charts={charts} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="User Growth">
          <SimpleLineChart
            data={toDayChartData(charts.userGrowth)}
            showWhenZero={false}
            emptyMessage="No new users in the last 30 days."
          />
        </AdminPanel>
        <AdminPanel title="Revenue Growth">
          <SimpleLineChart
            data={toDayChartData(charts.revenueGrowth).map((d: { label: string; value: number }) => ({
              label: d.label,
              value: d.value / 100,
            }))}
            showWhenZero={false}
            emptyMessage="No paid revenue in the last 30 days."
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
