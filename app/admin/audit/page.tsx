'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { formatDate } from '@/lib/billing/format';

type AuditRow = {
  log: {
    action: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
  };
  adminEmail: string | null;
};

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery<{ logs: AuditRow[] }>({
    queryKey: ['admin-audit'],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return (
    <div>
      <AdminPageHeader
        title="Audit Logs"
        description="Immutable record of all admin actions on the platform."
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading audit logs…</p>
      ) : (
        <DataTable
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'admin', label: 'Admin' },
            { key: 'action', label: 'Action' },
            { key: 'target', label: 'Target' },
          ]}
          rows={(data?.logs ?? []).map((r) => ({
            date: formatDate(r.log.createdAt),
            admin: r.adminEmail ?? '—',
            action: r.log.action,
            target: r.log.targetType
              ? `${r.log.targetType}:${r.log.targetId?.slice(0, 8) ?? ''}`
              : '—',
          }))}
        />
      )}
    </div>
  );
}
