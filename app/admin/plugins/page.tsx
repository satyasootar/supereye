'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { SimpleBarChart } from '@/components/admin/simple-bar-chart';
import { DataTable } from '@/components/admin/data-table';

export default function AdminPluginsPage() {
  const { data, isLoading } = useQuery<{
    totalConnections: number;
    uniqueUsers: number;
    byIntegration: Record<string, number>;
    userPlugins: Record<string, string[]>;
  }>({
    queryKey: ['admin-plugins'],
    queryFn: async () => {
      const res = await fetch('/api/admin/plugins');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm text-text-muted">Loading plugin analytics…</p>;
  }

  const integrationData = Object.entries(data.byIntegration).map(([label, value]) => ({
    label,
    value,
  }));

  const userRows = Object.entries(data.userPlugins)
    .slice(0, 50)
    .map(([userId, plugins]) => ({
      userId: userId.slice(0, 8) + '…',
      count: plugins.length,
      plugins: plugins.join(', '),
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
          <p className="mt-1 text-2xl font-semibold">{integrationData.length}</p>
        </AdminPanel>
      </div>

      <AdminPanel title="Most Used Plugins" className="mb-6">
        <SimpleBarChart data={integrationData} />
      </AdminPanel>

      <AdminPanel title="User Plugin Connections">
        <DataTable
          columns={[
            { key: 'userId', label: 'User ID' },
            { key: 'count', label: 'Count' },
            { key: 'plugins', label: 'Plugins' },
          ]}
          rows={userRows}
        />
      </AdminPanel>
    </div>
  );
}
