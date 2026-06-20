'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Loader2, Minus, Plus, RefreshCw } from 'lucide-react';
import { AdminPanel } from '@/components/admin/admin-shell';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCredits } from '@/lib/billing/format';

type BulkUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  balance: number | null;
  usedThisPeriod: number | null;
  planName: string | null;
};

type UsersResponse = {
  users: BulkUserRow[];
  callerRole: string;
};

type BulkResult = {
  updated: number;
  skipped: { userId: string; reason: string }[];
  errors: { userId: string; error: string }[];
};

function canModifyUser(user: BulkUserRow, isSuperAdmin: boolean): boolean {
  if (user.role === 'super_admin') return false;
  if (!isSuperAdmin && user.role === 'admin') return false;
  return true;
}

export function BulkTokenUpdatePanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<'add' | 'remove' | 'bonus' | 'reset'>('add');
  const [amount, setAmount] = useState('10000');
  const [monthlyAllocation, setMonthlyAllocation] = useState('100000');
  const [reason, setReason] = useState('Bulk admin allocation');
  const [lastResult, setLastResult] = useState<BulkResult | null>(null);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin-users-bulk'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
  });

  const isSuperAdmin = data?.callerRole === 'super_admin';
  const users = data?.users ?? [];

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(q) || user.name?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const modifiableUsers = useMemo(
    () => filteredUsers.filter((user) => canModifyUser(user, isSuperAdmin)),
    [filteredUsers, isSuperAdmin]
  );

  const allModifiableSelected =
    modifiableUsers.length > 0 &&
    modifiableUsers.every((user) => selectedIds.has(user.id));

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const userIds = [...selectedIds];
      const body =
        action === 'reset'
          ? {
              userIds,
              action: 'reset' as const,
              monthlyAllocation: Number(monthlyAllocation),
              reason,
            }
          : {
              userIds,
              action,
              amount: Number(amount),
              reason,
            };

      const res = await fetch('/api/admin/tokens/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? 'Bulk update failed');
      return result as BulkResult;
    },
    onSuccess: (result) => {
      setLastResult(result);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-bulk'] });
      queryClient.invalidateQueries({ queryKey: ['admin-token-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
    },
  });

  const toggleUser = (userId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allModifiableSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(modifiableUsers.map((user) => user.id)));
  };

  const selectAllUsers = () => {
    setSelectedIds(
      new Set(users.filter((user) => canModifyUser(user, isSuperAdmin)).map((user) => user.id))
    );
  };

  const canSubmit =
    selectedIds.size > 0 &&
    reason.trim().length > 0 &&
    (action === 'reset'
      ? Number(monthlyAllocation) >= 0
      : Number(amount) > 0);

  return (
    <div className="space-y-4">
      <AdminPanel title="Bulk token update">
        <p className="mb-4 text-sm text-text-muted">
          Select one or more users, choose an action, and apply the same token change to all
          selected accounts at once.
        </p>

        {!isSuperAdmin && (
          <p className="mb-4 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-muted">
            As an admin you can only bulk-remove tokens. Contact a super admin to add or reset
            balances.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as typeof action)}
              className="h-10 w-full rounded-lg border border-border-default bg-bg-surface px-3 text-sm text-text-primary"
            >
              {isSuperAdmin && <option value="add">Add tokens</option>}
              {isSuperAdmin && <option value="bonus">Grant bonus credits</option>}
              <option value="remove">Remove tokens</option>
              {isSuperAdmin && <option value="reset">Reset monthly allocation</option>}
            </select>
          </div>

          {action === 'reset' ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                New monthly allocation
              </label>
              <Input
                type="number"
                min={0}
                value={monthlyAllocation}
                onChange={(e) => setMonthlyAllocation(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Amount</label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-text-muted">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            disabled={!canSubmit || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate()}
          >
            {bulkMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : action === 'add' ? (
              <Plus className="mr-1.5 h-4 w-4" />
            ) : action === 'bonus' ? (
              <Gift className="mr-1.5 h-4 w-4" />
            ) : action === 'remove' ? (
              <Minus className="mr-1.5 h-4 w-4" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            Apply to {selectedIds.size} selected
          </Button>
          <Button variant="outline" size="sm" onClick={selectAllUsers}>
            Select all users
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
        </div>

        {bulkMutation.isError && (
          <p className="mt-3 text-sm text-destructive">{bulkMutation.error.message}</p>
        )}

        {lastResult && (
          <div className="mt-3 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm">
            <p className="text-text-primary">
              Updated <strong>{lastResult.updated}</strong> user
              {lastResult.updated === 1 ? '' : 's'}.
            </p>
            {lastResult.skipped.length > 0 && (
              <p className="mt-1 text-text-muted">
                Skipped {lastResult.skipped.length}:{' '}
                {lastResult.skipped
                  .slice(0, 3)
                  .map((s) => s.reason)
                  .join(', ')}
                {lastResult.skipped.length > 3 ? '…' : ''}
              </p>
            )}
            {lastResult.errors.length > 0 && (
              <p className="mt-1 text-destructive">
                Failed on {lastResult.errors.length} user
                {lastResult.errors.length === 1 ? '' : 's'}.
              </p>
            )}
          </div>
        )}
      </AdminPanel>

      <AdminPanel title="Select users">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="max-w-sm"
          />
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>
              {selectedIds.size} selected · {modifiableUsers.length} modifiable in view
            </span>
            <Button size="sm" variant="outline" onClick={toggleSelectAll}>
              {allModifiableSelected ? 'Deselect visible' : 'Select visible'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-text-muted">Loading users…</p>
        ) : (
          <DataTable
            columns={[
              { key: 'select', label: '', className: 'w-10' },
              { key: 'user', label: 'User' },
              { key: 'role', label: 'Role' },
              { key: 'plan', label: 'Plan' },
              { key: 'balance', label: 'Balance' },
              { key: 'used', label: 'Used' },
            ]}
            rows={filteredUsers.map((user) => {
              const modifiable = canModifyUser(user, isSuperAdmin);
              const checked = selectedIds.has(user.id);
              return {
                select: (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!modifiable}
                    onChange={() => toggleUser(user.id)}
                    className="h-4 w-4 rounded border-border-default accent-accent-blue"
                    aria-label={`Select ${user.email ?? user.name ?? 'user'}`}
                  />
                ),
                user: (
                  <div>
                    <p className="font-medium text-text-primary">
                      {user.name?.trim() || user.email || 'Unknown'}
                    </p>
                    {user.email && user.name && (
                      <p className="text-xs text-text-muted">{user.email}</p>
                    )}
                  </div>
                ),
                role: (
                  <Badge variant="outline" className="capitalize">
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                ),
                plan: user.planName ?? '—',
                balance: formatCredits(user.balance ?? 0),
                used: formatCredits(user.usedThisPeriod ?? 0),
              };
            })}
            emptyMessage="No users match your search."
          />
        )}
      </AdminPanel>
    </div>
  );
}
