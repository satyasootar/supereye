'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatTokens } from '@/lib/billing/format';

type EnterpriseRow = {
  account: {
    id: string;
    customMonthlyTokens: number | null;
  };
  org: { name: string };
  user: { name: string | null; email: string | null };
  plan: { name: string } | null;
};

export default function AdminEnterprisePage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ accounts: EnterpriseRow[] }>({
    queryKey: ['admin-enterprise'],
    queryFn: async () => {
      const res = await fetch('/api/admin/enterprise');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Create failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enterprise'] });
      setShowForm(false);
    },
  });

  return (
    <div>
      <AdminPageHeader
        title="Enterprise Accounts"
        description="Custom plans, token allocations, and organization-level settings."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            Create Account
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : (
        <DataTable
          columns={[
            { key: 'org', label: 'Organization' },
            { key: 'user', label: 'User' },
            { key: 'plan', label: 'Custom Plan' },
            { key: 'tokens', label: 'Monthly Tokens' },
          ]}
          rows={(data?.accounts ?? []).map((r) => ({
            org: r.org.name,
            user: r.user.email ?? '—',
            plan: r.plan?.name ?? 'Custom',
            tokens: formatTokens(r.account.customMonthlyTokens ?? 0),
          }))}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <AdminPanel title="New Enterprise Account" className="w-full max-w-md">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMutation.mutate({
                  organizationName: fd.get('orgName'),
                  userId: fd.get('userId'),
                  customMonthlyTokens: Number(fd.get('tokens')),
                });
              }}
            >
              <Input name="orgName" placeholder="Organization name" required />
              <Input name="userId" placeholder="User ID" required />
              <Input name="tokens" type="number" placeholder="Monthly tokens" required />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Create
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
