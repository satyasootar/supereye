'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Coins,
  Puzzle,
  Building2,
  ScrollText,
  Settings,
  ArrowLeft,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasSuperAdminRole } from '@/lib/billing/constants';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true, superAdminOnly: false },
  { href: '/admin/users', label: 'Users', icon: Users, superAdminOnly: false },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard, superAdminOnly: true },
  { href: '/admin/tokens', label: 'Tokens', icon: Coins, superAdminOnly: false },
  { href: '/admin/billing', label: 'Billing', icon: Receipt, superAdminOnly: false },
  { href: '/admin/plugins', label: 'Plugins', icon: Puzzle, superAdminOnly: false },
  { href: '/admin/enterprise', label: 'Enterprise', icon: Building2, superAdminOnly: true },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText, superAdminOnly: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, superAdminOnly: true },
];

export function AdminShell({
  children,
  userEmail,
  userRole,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  userRole?: string;
}) {
  const pathname = usePathname();
  const isSuperAdmin = hasSuperAdminRole(userRole);
  const navItems = NAV.filter((item) => isSuperAdmin || !item.superAdminOnly);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app text-text-primary">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border-subtle bg-bg-elevated lg:flex">
        <div className="shrink-0 border-b border-border-subtle px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Supereye Admin
          </p>
          <p className="mt-1 truncate text-sm text-text-secondary">{userEmail}</p>
          {userRole && (
            <p className="mt-0.5 text-xs text-text-muted capitalize">
              {userRole.replace('_', ' ')}
            </p>
          )}
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-accent-blue/10 font-medium text-accent-blue'
                    : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-border-subtle p-3">
          <Link
            href="/workspace"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-bg-surface hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-bg-elevated px-4 py-3 lg:px-8">
          <div className="lg:hidden">
            <p className="text-sm font-semibold">Admin</p>
          </div>
          <p className="hidden text-sm text-text-muted lg:block">
            Subscription, billing, and access control
          </p>
          <select
            className="rounded-lg border border-border-default bg-bg-surface px-2 py-1.5 text-sm lg:hidden"
            value={pathname}
            onChange={(e) => {
              window.location.href = e.target.value;
            }}
          >
            {navItems.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border-default bg-bg-elevated shadow-sm',
        className
      )}
    >
      {title && (
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-medium text-text-primary">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
