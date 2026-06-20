'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, X } from 'lucide-react';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatCredits, formatDateTime } from '@/lib/billing/format';

type BillingRequest = {
  id: string;
  type: 'credit_top_up' | 'subscription_change';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  userEmail: string | null;
  userName: string | null;
  packName: string | null;
  packTokenAmount: number | null;
  packPriceCents: number | null;
  planName: string | null;
  planPriceCents: number | null;
  currentPlanName: string | null;
  userNote: string | null;
  adminNote: string | null;
  createdAt: string;
};

type RequestsResponse = {
  requests: BillingRequest[];
  total: number;
};

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const;

function requestSummary(row: BillingRequest): string {
  if (row.type === 'credit_top_up') {
    const tokens = row.packTokenAmount ? formatCredits(row.packTokenAmount) : '';
    const price = row.packPriceCents != null ? formatCurrency(row.packPriceCents) : '';
    return [row.packName, tokens, price].filter(Boolean).join(' · ');
  }
  const from = row.currentPlanName ?? 'No plan';
  const to = row.planName ?? 'Unknown plan';
  const price = row.planPriceCents != null ? formatCurrency(row.planPriceCents) + '/mo' : '';
  return `${from} → ${to}${price ? ` · ${price}` : ''}`;
}

function requestTypeLabel(type: BillingRequest['type']): string {
  return type === 'credit_top_up' ? 'Credit top-up' : 'Plan change';
}

function statusBadge(status: BillingRequest['status']) {
  const variant =
    status === 'pending'
      ? 'outline'
      : status === 'approved'
        ? 'default'
        : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}

export default function AdminRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const pageSize = 25;

  const { data, isLoading, isError } = useQuery<RequestsResponse>({
    queryKey: ['admin-requests', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/requests?${params}`);
      if (!res.ok) throw new Error('Failed to load requests');
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: string;
      action: 'approve' | 'reject';
      note?: string;
    }) => {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Action failed');
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
    },
  });

  const requests = data?.requests ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <AdminPageHeader
        title="Billing Requests"
        description="Review and approve user credit top-up and subscription change requests."
      />

      <AdminPanel className="mb-6">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value || 'all'}
              size="sm"
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(0);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </AdminPanel>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading requests…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load requests.</p>
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'date', label: 'Submitted', className: 'whitespace-nowrap' },
              { key: 'user', label: 'User' },
              { key: 'type', label: 'Type' },
              { key: 'details', label: 'Details' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: 'Actions', className: 'min-w-[220px]' },
            ]}
            rows={requests.map((row) => ({
              date: formatDateTime(row.createdAt),
              user: (
                <div>
                  <p className="font-medium text-text-primary">
                    {row.userName?.trim() || row.userEmail || 'Unknown'}
                  </p>
                  {row.userEmail && row.userName && (
                    <p className="text-xs text-text-muted">{row.userEmail}</p>
                  )}
                </div>
              ),
              type: requestTypeLabel(row.type),
              details: (
                <div>
                  <p>{requestSummary(row)}</p>
                  {row.userNote && (
                    <p className="mt-1 text-xs text-text-muted">Note: {row.userNote}</p>
                  )}
                </div>
              ),
              status: statusBadge(row.status),
              actions:
                row.status === 'pending' ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Optional admin note"
                      value={adminNote[row.id] ?? ''}
                      onChange={(e) =>
                        setAdminNote((current) => ({ ...current, [row.id]: e.target.value }))
                      }
                      className="h-8 text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({
                            id: row.id,
                            action: 'approve',
                            note: adminNote[row.id],
                          })
                        }
                      >
                        {actionMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({
                            id: row.id,
                            action: 'reject',
                            note: adminNote[row.id],
                          })
                        }
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted">
                    {row.adminNote ? `Note: ${row.adminNote}` : '—'}
                  </span>
                ),
            }))}
            emptyMessage="No billing requests match your filters."
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-text-muted">
              {total === 0
                ? 'No requests'
                : `Showing ${page * pageSize + 1}–${Math.min(total, (page + 1) * pageSize)} of ${total}`}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="self-center text-sm text-text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
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
