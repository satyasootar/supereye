'use client';

import { useState } from 'react';
import {
  X,
  User,
  Shield,
  Coins,
  Clock,
  Calendar,
  Activity,
  Loader2,
  Minus,
  Plus,
  Gift,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletUsageSummary } from '@/components/billing/usage-bar';
import { formatDate, formatTokens } from '@/lib/billing/format';
import { formatDuration } from '@/lib/monitoring/format';
import { cn } from '@/lib/utils';

export type ManageUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  balance: number | null;
  usedThisPeriod: number | null;
  planName: string | null;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  totalTimeSpentSeconds: number;
  aiTokensUsed: number;
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function roleLabel(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function roleBadgeClass(role: string) {
  switch (role) {
    case 'super_admin':
      return 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue';
    case 'admin':
      return 'border-violet-500/40 bg-violet-500/10 text-violet-400';
    case 'enterprise_user':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-500';
    default:
      return '';
  }
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-bg-surface/50 px-3 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

type ManageUserDialogProps = {
  user: ManageUserRow;
  isSuperAdmin: boolean;
  canModify: boolean;
  isActionPending: boolean;
  isTokenPending: boolean;
  onClose: () => void;
  onAction: (payload: Record<string, unknown>) => void;
  onTokenAction: (payload: Record<string, unknown>) => void;
};

export function ManageUserDialog({
  user,
  isSuperAdmin,
  canModify,
  isActionPending,
  isTokenPending,
  onClose,
  onAction,
  onTokenAction,
}: ManageUserDialogProps) {
  const [tokenAmount, setTokenAmount] = useState('10000');
  const [tokenReason, setTokenReason] = useState('Admin allocation');

  const initials = (user.name ?? user.email ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const totalAllocation = (user.balance ?? 0) + (user.usedThisPeriod ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border-default bg-bg-elevated shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="manage-user-title"
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-border-subtle px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-highlight text-sm font-semibold text-text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="manage-user-title" className="truncate text-base font-semibold text-text-primary">
              {user.name ?? 'Unnamed user'}
            </h2>
            <p className="truncate text-sm text-text-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className={cn('capitalize', roleBadgeClass(user.role))}>
                {roleLabel(user.role)}
              </Badge>
              <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                {user.status}
              </Badge>
              <Badge
                variant="outline"
                className={
                  user.isOnline
                    ? 'border-[color:var(--priority-normal)]/40 bg-[color:var(--priority-normal)]/10 text-[color:var(--priority-normal)]'
                    : ''
                }
              >
                {user.isOnline ? 'Online' : 'Offline'}
              </Badge>
              {user.planName && (
                <Badge variant="outline">{user.planName}</Badge>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Usage */}
          <section>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Coins className="h-3.5 w-3.5" />
              Usage this period
            </h3>
            <WalletUsageSummary
              wallet={{
                balance: user.balance ?? 0,
                monthlyAllocation: totalAllocation,
                usedThisPeriod: user.usedThisPeriod ?? 0,
                unlimited: false,
              }}
              role={user.role}
              aiTokensThisPeriod={user.aiTokensUsed}
              effectiveLimit={totalAllocation}
            />
            <p className="mt-2 text-xs text-text-muted">
              Balance: <span className="font-medium text-text-secondary">{formatTokens(user.balance ?? 0)}</span>
              {' · '}
              AI tokens (all time): <span className="font-medium text-text-secondary">{formatTokens(user.aiTokensUsed)}</span>
            </p>
          </section>

          {/* Activity */}
          <section>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <InfoItem icon={Clock} label="Last login" value={formatDateTime(user.lastLoginAt)} />
              <InfoItem icon={Clock} label="Last seen" value={formatDateTime(user.lastSeenAt)} />
              <InfoItem
                icon={Activity}
                label="Time in app"
                value={formatDuration(user.totalTimeSpentSeconds)}
              />
              <InfoItem icon={Calendar} label="Joined" value={formatDate(user.createdAt)} />
            </div>
          </section>

          {/* Role management */}
          {canModify ? (
            <section>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Shield className="h-3.5 w-3.5" />
                Account actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionPending}
                    onClick={() => onAction({ action: 'suspend' })}
                  >
                    {isActionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Suspend'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionPending}
                    onClick={() => onAction({ action: 'activate' })}
                  >
                    {isActionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Activate'}
                  </Button>
                )}
                {isSuperAdmin && user.role !== 'admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionPending}
                    onClick={() => onAction({ role: 'admin' })}
                  >
                    Promote to Admin
                  </Button>
                )}
                {user.role !== 'enterprise_user' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionPending}
                    onClick={() => onAction({ role: 'enterprise_user' })}
                  >
                    Set Enterprise
                  </Button>
                )}
                {user.role !== 'user' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionPending}
                    onClick={() => onAction({ role: 'user' })}
                  >
                    Set as User
                  </Button>
                )}
              </div>
            </section>
          ) : (
            <div className="rounded-lg border border-border-subtle bg-bg-surface/50 px-3 py-2.5 text-sm text-text-muted">
              You cannot modify this account&apos;s permissions.
            </div>
          )}

          {/* Token actions */}
          {canModify && (
            <section>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Coins className="h-3.5 w-3.5" />
                Adjust tokens
              </h3>
              {!isSuperAdmin && (
                <p className="mb-3 text-xs text-text-muted">
                  Admins can only decrease balances. Contact a super admin to grant more tokens.
                </p>
              )}
              <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-surface/40 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="token-amount" className="mb-1 block text-xs font-medium text-text-muted">
                      Amount
                    </label>
                    <Input
                      id="token-amount"
                      type="number"
                      min={1}
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label htmlFor="token-reason" className="mb-1 block text-xs font-medium text-text-muted">
                      Reason
                    </label>
                    <Input
                      id="token-reason"
                      value={tokenReason}
                      onChange={(e) => setTokenReason(e.target.value)}
                      placeholder="Reason for adjustment"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isSuperAdmin && (
                    <>
                      <Button
                        size="sm"
                        disabled={isTokenPending || !tokenAmount || !tokenReason.trim()}
                        onClick={() =>
                          onTokenAction({
                            action: 'add',
                            amount: Number(tokenAmount),
                            reason: tokenReason,
                          })
                        }
                      >
                        {isTokenPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Add
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isTokenPending || !tokenAmount || !tokenReason.trim()}
                        onClick={() =>
                          onTokenAction({
                            action: 'bonus',
                            amount: Number(tokenAmount),
                            reason: tokenReason,
                          })
                        }
                      >
                        <Gift className="mr-1 h-3.5 w-3.5" />
                        Bonus
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isTokenPending || !tokenAmount || !tokenReason.trim()}
                    onClick={() =>
                      onTokenAction({
                        action: 'remove',
                        amount: Number(tokenAmount),
                        reason: tokenReason,
                      })
                    }
                  >
                    <Minus className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-border-subtle px-5 py-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
