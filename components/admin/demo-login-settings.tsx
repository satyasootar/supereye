'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AdminPanel } from '@/components/admin/admin-shell';
import { DEMO_ACCOUNT_EMAIL } from '@/lib/auth/demo-account';
import { cn } from '@/lib/utils';

type SettingsResponse = {
  settings: {
    demoLoginEnabled: boolean;
    updatedAt: string | null;
  };
};

export function DemoLoginSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery<SettingsResponse>({
    queryKey: ['admin-platform-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (demoLoginEnabled: boolean) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoLoginEnabled }),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json() as Promise<SettingsResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-platform-settings'], data);
    },
  });

  const enabled = settingsQuery.data?.settings.demoLoginEnabled ?? true;
  const isBusy = settingsQuery.isLoading || patchMutation.isPending;

  return (
    <AdminPanel title="Demo Login">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 text-sm">
          <p className="text-text-primary">
            Allow visitors to sign in with the shared demo account on the login page.
          </p>
          <p className="text-text-muted">
            Demo account: <span className="font-medium text-text-secondary">{DEMO_ACCOUNT_EMAIL}</span>
          </p>
          {patchMutation.isError && (
            <p className="text-destructive" role="alert">
              Could not save setting. Please try again.
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle demo login"
          disabled={isBusy}
          onClick={() => patchMutation.mutate(!enabled)}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-60',
            enabled
              ? 'border-accent-blue bg-accent-blue'
              : 'border-border-default bg-bg-surface'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-5' : 'translate-x-1'
            )}
          />
          {isBusy && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
            </span>
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        {enabled
          ? 'Demo login is visible on /login. Disabling also blocks credentials sign-in for the demo account.'
          : 'Demo login is hidden from /login and blocked server-side.'}
      </p>
    </AdminPanel>
  );
}
