'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AUDIT_ACTION_LABELS,
  formatAuditAction,
  formatAuditMetadata,
  formatAuditTarget,
} from '@/lib/billing/audit-log-display';
import { downloadCsv, formatDateTime } from '@/lib/billing/format';
import { useDebounce } from '@/lib/hooks/use-debounce';

type AuditRow = {
  log: {
    id: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
  adminEmail: string | null;
  adminName: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
  targetPlanName: string | null;
};

type AuditResponse = {
  logs: AuditRow[];
  total: number;
  actions: string[];
};

const PAGE_SIZE = 50;

function formatAdminLabel(row: AuditRow): string {
  return row.adminName?.trim() || row.adminEmail || 'Unknown admin';
}

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useQuery<AuditResponse>({
    queryKey: ['admin-audit', debouncedSearch, actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const actionOptions = useMemo(() => {
    const fromApi = data?.actions ?? [];
    const merged = new Set([...Object.keys(AUDIT_ACTION_LABELS), ...fromApi]);
    return [...merged].sort();
  }, [data?.actions]);

  const rows = (data?.logs ?? []).map((row) => ({
    date: formatDateTime(row.log.createdAt),
    admin: formatAdminLabel(row),
    action: formatAuditAction(row.log.action),
    target: formatAuditTarget({
      targetType: row.log.targetType,
      targetId: row.log.targetId,
      targetUserName: row.targetUserName,
      targetUserEmail: row.targetUserEmail,
      targetPlanName: row.targetPlanName,
      metadata: row.log.metadata,
    }),
    details: formatAuditMetadata(row.log.metadata),
  }));

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (page + 1) * PAGE_SIZE);

  const handleExport = () => {
    downloadCsv('audit-logs.csv', [
      ['Date', 'Admin', 'Action', 'Target', 'Details'],
      ...rows.map((row) => [row.date, row.admin, row.action, row.target, row.details]),
    ]);
  };

  return (
    <div>
      <AdminPageHeader
        title="Audit Logs"
        description="Immutable record of every admin action — user changes, billing, tokens, plans, and enterprise setup."
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <AdminPanel className="mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search admin, target, action, or details…"
              className="pl-9"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 rounded-lg border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
          >
            <option value="">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {formatAuditAction(action)}
              </option>
            ))}
          </select>
        </div>
      </AdminPanel>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading audit logs…</p>
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'date', label: 'Date', className: 'whitespace-nowrap' },
              { key: 'admin', label: 'Admin' },
              { key: 'action', label: 'Action' },
              { key: 'target', label: 'Target' },
              { key: 'details', label: 'Details', className: 'max-w-[280px]' },
            ]}
            rows={rows.map((row) => ({
              ...row,
              details: <span className="line-clamp-2 text-[12px]">{row.details}</span>,
            }))}
            emptyMessage="No audit logs match your filters."
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">
              {total === 0
                ? 'No entries'
                : `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()}`}
              {isFetching && !isLoading ? ' · Refreshing…' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
