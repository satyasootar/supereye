'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import { getOnboardingPlugins, getPlugin } from '@/lib/plugins/registry';
import { useActivePlugins, ACTIVE_PLUGINS_KEY } from '@/hooks/use-active-plugins';
import { USER_PREFERENCES_KEY } from '@/hooks/use-workspaces';

const PLUGIN_META: Record<
  string,
  {
    accent: string;
    accentBg: string;
    accentBorder: string;
    iconBg: string;
  }
> = {
  email: {
    accent: 'text-[#EA4335]',
    accentBg: 'bg-[#EA4335]/10',
    accentBorder: 'border-[#EA4335]/35',
    iconBg: 'bg-white dark:bg-bg-elevated',
  },
  calendar: {
    accent: 'text-[#4285F4]',
    accentBg: 'bg-[#4285F4]/10',
    accentBorder: 'border-[#4285F4]/35',
    iconBg: 'bg-white dark:bg-bg-elevated',
  },
  github: {
    accent: 'text-text-muted',
    accentBg: 'bg-bg-highlight',
    accentBorder: 'border-border-default',
    iconBg: 'bg-white dark:bg-bg-elevated',
  },
};

export function OnboardingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { plugins, activePlugins, refetch } = useActivePlugins();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [justConnected, setJustConnected] = useState(false);

  const onboardingPlugins = getOnboardingPlugins();
  const connectedCount = activePlugins.length;
  const canContinue = connectedCount > 0;

  useEffect(() => {
    if (searchParams.get('connected') === '1') {
      setJustConnected(true);
      void refetch();
      router.replace('/workspace/onboarding', { scroll: false });
      const t = setTimeout(() => setJustConnected(false), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams, refetch, router]);

  const connectPlugin = async (pluginId: string) => {
    const plugin = getPlugin(pluginId);
    if (!plugin || plugin.comingSoon) return;

    setConnecting(pluginId);
    setConnectError(null);
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin: plugin.corsairPlugin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Connect failed'
        );
      }
      if (!data.authUrl) throw new Error('No authorization URL returned');
      window.location.href = data.authUrl;
    } catch (e) {
      setConnecting(null);
      setConnectError(e instanceof Error ? e.message : 'Connect failed');
    }
  };

  const finishOnboarding = async () => {
    setFinishing(true);
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      await queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_KEY });
      await queryClient.invalidateQueries({ queryKey: ACTIVE_PLUGINS_KEY });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.push('/workspace');
      router.refresh();
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col overflow-y-auto bg-bg-app custom-scrollbar">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(66,133,244,0.18), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(234,67,53,0.08), transparent)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 pb-32">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h1 className="text-[32px] font-semibold tracking-tight text-text-primary sm:text-[36px]">
            Connect your tools
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-text-muted">
            Link the apps you use daily. Each workspace holds up to two plugins —
            we&apos;ll organize them automatically.
          </p>
        </motion.header>

        <AnimatePresence>
          {justConnected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mt-6 flex w-full max-w-lg items-center gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-4 py-3 text-[13px] text-accent-blue"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Plugin connected and added to your workspace.
            </motion.div>
          )}
        </AnimatePresence>

        {connectError && (
          <p className="mx-auto mt-6 w-full max-w-lg rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-[13px] text-destructive">
            {connectError}
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {onboardingPlugins.map((plugin, index) => {
            const status = plugins.find((p) => p.id === plugin.id);
            const connected = status?.connected ?? false;
            const meta = PLUGIN_META[plugin.id] ?? PLUGIN_META.email;
            const isComingSoon = plugin.comingSoon;
            const isConnecting = connecting === plugin.id;

            return (
              <motion.article
                key={plugin.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.35 }}
                className={cn(
                  'group relative flex flex-col rounded-md border p-5 transition-all duration-300',
                  connected
                    ? cn(meta.accentBg, meta.accentBorder, 'shadow-sm')
                    : 'border-border-default bg-bg-elevated/80 hover:border-border-strong hover:bg-bg-elevated',
                  isComingSoon && 'opacity-75'
                )}
              >
                {isComingSoon && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                    <Lock className="h-2.5 w-2.5" />
                    Soon
                  </span>
                )}

                <div
                  className={cn(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border-subtle shadow-sm',
                    meta.iconBg
                  )}
                >
                  <PluginBrandIcon pluginId={plugin.id} size={28} />
                </div>

                <h3 className="text-[15px] font-semibold text-text-primary">
                  {plugin.label}
                </h3>
                <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-text-muted">
                  {plugin.description}
                </p>

                <div className="mt-5">
                  {connected ? (
                    <span
                      className={cn(
                        'inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-[12px] font-semibold',
                        meta.accentBorder,
                        meta.accentBg,
                        meta.accent
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  ) : isComingSoon ? (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-md border border-border-subtle bg-bg-surface px-3 py-2.5 text-[12px] font-medium text-text-muted"
                    >
                      Coming soon
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={() => connectPlugin(plugin.id)}
                      className={cn(
                        'w-full rounded-md border border-border-default bg-bg-surface px-3 py-2.5 text-[12px] font-semibold text-text-primary transition-all',
                        'hover:border-border-strong hover:bg-bg-highlight active:scale-[0.98] disabled:opacity-50'
                      )}
                    >
                      {isConnecting ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        `Connect ${plugin.label}`
                      )}
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        {connectedCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-[13px] text-text-muted"
          >
            {connectedCount} plugin{connectedCount > 1 ? 's' : ''} connected — assigned
            to your workspace automatically.
          </motion.p>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border-subtle bg-bg-app/90 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-[13px] text-text-muted sm:text-left">
            {canContinue
              ? 'Ready when you are — add more plugins or continue.'
              : 'Connect at least one plugin to continue.'}
          </p>
          <button
            type="button"
            disabled={!canContinue || finishing}
            onClick={finishOnboarding}
            className="flex min-w-[160px] items-center justify-center gap-2 rounded-md bg-accent-blue px-6 py-3 text-[14px] font-semibold text-text-inverse shadow-lg shadow-accent-blue/20 transition-all hover:bg-accent-blue-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {finishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
