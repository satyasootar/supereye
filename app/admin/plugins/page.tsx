'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { PluginUsageChart } from '@/components/admin/plugin-usage-chart';
import { DataTable } from '@/components/admin/data-table';

type PluginAnalyticsResponse = {
  totalConnections: number;
  uniqueUsers: number;
  byPlugin: { pluginId: string; label: string; count: number }[];
  connectionTrend: Array<Record<string, string | number>>;
  pluginSeries: { key: string; label: string }[];
  userPluginConnections: { name: string; count: number; plugins: string[] }[];
};

function normalizePluginAnalytics(data: Partial<PluginAnalyticsResponse>): PluginAnalyticsResponse {
  return {
    totalConnections: data.totalConnections ?? 0,
    uniqueUsers: data.uniqueUsers ?? 0,
    byPlugin: data.byPlugin ?? [],
    connectionTrend: data.connectionTrend ?? [],
    pluginSeries: data.pluginSeries ?? [],
    userPluginConnections: data.userPluginConnections ?? [],
  };
}

export default function AdminPluginsPage() {
  const { data, isLoading } = useQuery<PluginAnalyticsResponse>({
    queryKey: ['admin-plugins', 3],
    queryFn: async () => {
      const res = await fetch('/api/admin/plugins');
      if (!res.ok) throw new Error('Failed');
      return normalizePluginAnalytics(await res.json());
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm text-text-muted">Loading plugin analytics…</p>;
  }

  const userRows = (data.userPluginConnections ?? []).slice(0, 50).map((row) => ({
    name: row.name,
    count: row.count,
    plugins: row.plugins.join(', '),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Plugins"
        description="Integration adoption, active connections, and per-user plugin usage."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AdminPanel>
          <p className="text-xs uppercase text-text-muted">Total connections</p>
          <p className="mt-1 text-2xl font-semibold">{data.totalConnections}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs uppercase text-text-muted">Users with plugins</p>
          <p className="mt-1 text-2xl font-semibold">{data.uniqueUsers}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs uppercase text-text-muted">Integrations</p>
          <p className="mt-1 text-2xl font-semibold">{data.pluginSeries.length}</p>
        </AdminPanel>
      </div>

      <AdminPanel title="Most Used Plugins" className="mb-6">
        <p className="mb-4 text-sm text-text-muted">
          Cumulative connections per plugin over the last 30 days.
        </p>
        <PluginUsageChart
          connectionTrend={data.connectionTrend ?? []}
          pluginSeries={data.pluginSeries ?? []}
        />
      </AdminPanel>

      <AdminPanel title="User Plugin Connections">
        <DataTable
          columns={[
            { key: 'name', label: 'User' },
            { key: 'count', label: 'Count' },
            { key: 'plugins', label: 'Plugins' },
          ]}
          rows={userRows}
        />
      </AdminPanel>
    </div>
  );
}
