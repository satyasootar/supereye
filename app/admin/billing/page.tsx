'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, downloadCsv } from '@/lib/billing/format';
import { Badge } from '@/components/ui/badge';

type InvoiceRow = {
  invoice: {
    invoiceNumber: string;
    amountCents: number;
    status: string;
    paymentMethod: string | null;
    issuedAt: string;
    periodEnd: string | null;
  };
  userName: string | null;
  userEmail: string | null;
  planName: string | null;
};

export default function AdminBillingPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<{ invoices: InvoiceRow[] }>({
    queryKey: ['admin-billing', search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/billing?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const invoices = data?.invoices ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Billing"
        description="View invoices, payment status, and subscription renewals."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                'invoices.csv',
                [
                  ['Invoice', 'User', 'Plan', 'Amount', 'Status', 'Date', 'Renewal'],
                  ...invoices.map((r) => [
                    r.invoice.invoiceNumber,
                    r.userEmail ?? '',
                    r.planName ?? '',
                    formatCurrency(r.invoice.amountCents),
                    r.invoice.status,
                    formatDate(r.invoice.issuedAt),
                    formatDate(r.invoice.periodEnd),
                  ]),
                ]
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search invoices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="open">Open</option>
          <option value="draft">Draft</option>
          <option value="void">Void</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading invoices…</p>
      ) : (
        <DataTable
          columns={[
            { key: 'number', label: 'Invoice' },
            { key: 'user', label: 'User' },
            { key: 'plan', label: 'Plan' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'date', label: 'Date' },
            { key: 'renewal', label: 'Renewal' },
          ]}
          rows={invoices.map((r) => ({
            number: r.invoice.invoiceNumber,
            user: (
              <div>
                <p>{r.userName ?? '—'}</p>
                <p className="text-xs text-text-muted">{r.userEmail}</p>
              </div>
            ),
            plan: r.planName ?? '—',
            amount: formatCurrency(r.invoice.amountCents),
            status: <Badge variant="outline">{r.invoice.status}</Badge>,
            date: formatDate(r.invoice.issuedAt),
            renewal: formatDate(r.invoice.periodEnd),
          }))}
        />
      )}
    </div>
  );
}
