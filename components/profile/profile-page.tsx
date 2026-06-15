'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Link2,
  Palette,
  Shield,
  Mail,
  Calendar,
  CheckCircle2,
  Loader2,
  LogOut,
  Sun,
  Moon,
  Monitor,
  LayoutPanelLeft,
  TerminalSquare,
  BarChart3,
  Bot,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { WorkspaceLayoutSection } from '@/components/profile/workspace-layout-section';
import { DeleteAccountSection } from '@/components/profile/delete-account-section';
import { KeyboardShortcutsSection } from '@/components/profile/keyboard-shortcuts-section';
import { UsageDashboardSection } from '@/components/profile/usage-dashboard-section';
import { BotSettingsSection } from '@/components/profile/bot-settings-section';
import { BillingSection } from '@/components/profile/billing-section';
import { getPlugin } from '@/lib/plugins/registry';
import { useAppStore } from '@/lib/store/app-store';
import type { UserProfile } from '@/lib/user/profile';

type ProfileTab = 'account' | 'connections' | 'workspace' | 'appearance' | 'security' | 'shortcuts' | 'dashboard' | 'bot' | 'billing';

const TABS: { id: ProfileTab; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'workspace', label: 'Workspace', icon: LayoutPanelLeft },
  { id: 'shortcuts', label: 'Shortcuts', icon: TerminalSquare },
  { id: 'bot', label: 'AI Bot', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
];

type ProfilePageClientProps = {
  profile: UserProfile;
};

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { leftSidebarCollapsed, setLeftSidebarCollapsed } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState<'default' | 'twitter' | 'claude' | 'caffeine' | 'sage' | 'paper'>('default');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('color-theme') as 'default' | 'twitter' | 'claude' | 'caffeine' | 'sage' | 'paper';
    if (saved) {
      setColorTheme(saved);
    }
  }, []);

  const handleColorThemeChange = (newTheme: 'default' | 'twitter' | 'claude' | 'caffeine' | 'sage' | 'paper') => {
    setColorTheme(newTheme);
    localStorage.setItem('color-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    window.dispatchEvent(new Event('color-theme-change'));
  };

  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam! : 'account';

  const [connecting, setConnecting] = useState<string | null>(null);

  const setTab = useCallback(
    (tab: ProfileTab) => {
      router.replace(`/workspace/profile?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const connectIntegration = async (corsairPlugin: string) => {
    setConnecting(corsairPlugin);
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin: corsairPlugin }),
      });
      if (!res.ok) throw new Error('Failed to start connection');
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch {
      setConnecting(null);
    }
  };

  const initials = (profile.name ?? profile.email ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = format(new Date(profile.createdAt), 'MMMM d, yyyy');

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg-app">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/workspace"
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-highlight px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to workspace
          </Link>
          <div className="hidden h-5 w-px bg-border-subtle sm:block" />
          <h1 className="hidden text-[15px] font-semibold text-text-primary sm:block">
            Profile & settings
          </h1>
        </div>
        <Badge variant="outline" className="border-border-default text-text-muted">
          {profile.authProvider === 'google' ? 'Google account' : profile.authProvider}
        </Badge>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Settings nav */}
        <nav className="hidden w-[220px] shrink-0 flex-col border-r border-border-subtle bg-bg-surface p-3 md:flex">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Settings
          </p>
          <ul className="flex flex-col gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setTab(tab.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] transition-colors',
                      isActive
                        ? 'border-l-2 border-accent-blue bg-bg-highlight font-medium text-text-primary'
                        : 'border-l-2 border-transparent text-text-muted hover:bg-bg-overlay hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto border-t border-border-subtle pt-4">
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] text-text-muted hover:bg-bg-overlay hover:text-text-primary transition-colors border-l-2 border-transparent"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 shrink-0" />
                Admin
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </Link>
          </div>
        </nav>

        {/* Mobile tab bar */}
        <div className="flex w-full min-w-0 flex-col">
          <div className="flex gap-1 overflow-x-auto border-b border-border-subtle bg-bg-surface px-4 py-2 md:hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                    isActive
                      ? 'bg-bg-highlight text-text-primary'
                      : 'text-text-muted hover:bg-bg-overlay'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-bg-overlay transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
              <ExternalLink className="ml-0.5 h-3 w-3 opacity-70" />
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div
              className={cn(
                'mx-auto px-4 py-8 sm:px-6',
                activeTab === 'dashboard' ? 'max-w-4xl' : 'max-w-2xl'
              )}
            >
              {activeTab === 'account' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-5 rounded-[var(--radius)] border border-border-default bg-bg-elevated p-6">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-default bg-bg-highlight">
                      {profile.image ? (
                        <img
                          src={profile.image}
                          alt={profile.name ?? 'Profile'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[18px] font-semibold text-text-secondary">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-[18px] font-semibold text-text-primary">
                        {profile.name ?? 'User'}
                      </h2>
                      <p className="truncate text-[13px] text-text-muted">{profile.email}</p>
                      <p className="mt-1 text-[12px] text-text-muted">Member since {memberSince}</p>
                    </div>
                  </div>

                  <ProfileSection
                    title="Account details"
                    description="Your identity is managed through Google sign-in. Profile photo and name sync from your Google account."
                  >
                    <ProfileRow label="Full name" description="From your Google account">
                      <span className="text-[13px] text-text-secondary">
                        {profile.name ?? '—'}
                      </span>
                    </ProfileRow>
                    <ProfileRow label="Email address" description="Used for sign-in and notifications">
                      <span className="text-[13px] text-text-secondary">
                        {profile.email ?? '—'}
                      </span>
                    </ProfileRow>
                    <ProfileRow label="User ID" description="Internal identifier for your workspace">
                      <code className="rounded-md bg-bg-highlight px-2 py-1 font-mono text-[11px] text-text-muted">
                        {profile.id.slice(0, 8)}…
                      </code>
                    </ProfileRow>
                  </ProfileSection>
                </div>
              )}

              {activeTab === 'connections' && (
                <div className="flex flex-col gap-6">
                  <ProfileSection
                    title="Connected services"
                    description="Supereye uses separate OAuth connections for Gmail and Calendar. These power email sync, scheduling, and your AI assistant."
                  >
                    {profile.integrations.map((integration) => {
                      const meta = getPlugin(integration.id);
                      const Icon = integration.id === 'email' ? Mail : Calendar;
                      return (
                        <ProfileRow
                          key={integration.id}
                          label={integration.label}
                          description={
                            integration.connected
                              ? `Connected · last synced ${integration.connectedAt ? format(new Date(integration.connectedAt), 'MMM d, yyyy') : 'recently'}`
                              : meta?.description ?? 'Not connected'
                          }
                        >
                          <div className="flex items-center gap-2">
                            {integration.connected ? (
                              <Badge className="gap-1 bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/15">
                                <CheckCircle2 className="h-3 w-3" />
                                Connected
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-border-default"
                                disabled={connecting === integration.corsairPlugin}
                                onClick={() => connectIntegration(integration.corsairPlugin)}
                              >
                                {connecting === integration.corsairPlugin ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Icon className="h-3.5 w-3.5" />
                                )}
                                Connect
                              </Button>
                            )}
                          </div>
                        </ProfileRow>
                      );
                    })}
                  </ProfileSection>

                  <ProfileSection
                    title="How connections work"
                    description="Sign-in and integrations are separate for security."
                  >
                    <p className="text-[13px] leading-relaxed text-text-secondary">
                      Your Google login authenticates you into Supereye. Gmail and Calendar
                      connections grant the permissions needed to read mail, send messages, and
                      manage events on your behalf. You can reconnect at any time if permissions
                      change.
                    </p>
                  </ProfileSection>
                </div>
              )}

              {activeTab === 'workspace' && (
                <div className="flex flex-col gap-6">
                  <WorkspaceLayoutSection />
                </div>
              )}

              {activeTab === 'shortcuts' && <KeyboardShortcutsSection />}

              {activeTab === 'bot' && <BotSettingsSection />}

              {activeTab === 'dashboard' && <UsageDashboardSection />}

              {activeTab === 'billing' && <BillingSection />}

              {activeTab === 'appearance' && (
                <div className="flex flex-col gap-6">
                  <ProfileSection
                    title="Appearance"
                    description="Customize how Supereye looks on your device."
                  >
                    <ProfileRow label="Mode" description="Choose between Light, Dark, or System mode">
                      <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-surface p-1">
                        {(
                          [
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                            { value: 'system', label: 'System', icon: Monitor },
                          ] as const
                        ).map((option) => {
                          const Icon = option.icon;
                          const isActive = mounted && theme === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTheme(option.value)}
                              className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                                isActive
                                  ? 'bg-bg-highlight text-text-primary shadow-sm'
                                  : 'text-text-muted hover:text-text-primary'
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </ProfileRow>

                    <ProfileRow
                      label="Sidebar"
                      description="Start with the navigation sidebar collapsed"
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={leftSidebarCollapsed}
                        onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          leftSidebarCollapsed ? 'bg-accent-blue' : 'bg-bg-overlay'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                            leftSidebarCollapsed && 'translate-x-5'
                          )}
                        />
                      </button>
                    </ProfileRow>
                  </ProfileSection>

                  <ProfileSection
                    title="Color Palette"
                    description="Choose your preferred color palette theme"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      {(
                        [
                          {
                            value: 'default',
                            label: 'Default (Warm Beach)',
                            colors: {
                              lightBg: '#fdfbf7',
                              lightAccent: '#b45309',
                              darkAccent: '#f97316',
                              darkBg: '#1c1917',
                            },
                          },
                          {
                            value: 'twitter',
                            label: 'Twitter Blue',
                            colors: {
                              lightBg: '#ffffff',
                              lightAccent: '#1e9df1',
                              darkAccent: '#1c9cf0',
                              darkBg: '#000000',
                            },
                          },
                          {
                            value: 'claude',
                            label: 'Claude Peach',
                            colors: {
                              lightBg: '#faf9f5',
                              lightAccent: '#c96442',
                              darkAccent: '#d97757',
                              darkBg: '#262624',
                            },
                          },
                          {
                            value: 'caffeine',
                            label: 'Caffeine',
                            colors: {
                              lightBg: '#f9f9f9',
                              lightAccent: '#644a40',
                              darkAccent: '#ffe0c2',
                              darkBg: '#111111',
                            },
                          },
                          {
                            value: 'sage',
                            label: 'Sage Garden',
                            colors: {
                              lightBg: '#f8f7f4',
                              lightAccent: '#7c9082',
                              darkAccent: '#7c9082',
                              darkBg: '#0a0a0a',
                            },
                          },
                          {
                            value: 'paper',
                            label: 'Vintage Paper',
                            colors: {
                              lightBg: '#f5f1e6',
                              lightAccent: '#a67c52',
                              darkAccent: '#c0a080',
                              darkBg: '#2d2621',
                            },
                          },
                        ] as const
                      ).map((option) => {
                        const isActive = mounted && colorTheme === option.value;
                        const isDarkActive = mounted && resolvedTheme === 'dark';
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleColorThemeChange(option.value)}
                            className={cn(
                              'flex items-center justify-between w-full rounded-[var(--radius)] border p-3 text-left transition-all hover:bg-bg-highlight/40',
                              isActive
                                ? 'border-accent-blue bg-bg-highlight/20 shadow-sm'
                                : 'border-border-subtle bg-bg-surface'
                            )}
                          >
                            <span className="text-[13px] font-medium text-text-primary">
                              {option.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {isDarkActive ? (
                                <>
                                  <span
                                    className="h-5 w-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm transition-all"
                                    style={{ backgroundColor: option.colors.darkAccent }}
                                    title="Dark Accent"
                                  />
                                  <span
                                    className="h-5 w-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm transition-all"
                                    style={{ backgroundColor: option.colors.darkBg }}
                                    title="Dark Background"
                                  />
                                </>
                              ) : (
                                <>
                                  <span
                                    className="h-5 w-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm transition-all"
                                    style={{ backgroundColor: option.colors.lightBg }}
                                    title="Light Background"
                                  />
                                  <span
                                    className="h-5 w-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm transition-all"
                                    style={{ backgroundColor: option.colors.lightAccent }}
                                    title="Light Accent"
                                  />
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {/* More themes coming soon */}
                      <div className="col-span-1 sm:col-span-2 flex items-center justify-between w-full rounded-[var(--radius)] border border-dashed border-border-default bg-bg-surface/30 p-3 opacity-60 pointer-events-none select-none">
                        <span className="text-[13px] font-medium text-text-muted italic">
                          More themes coming soon...
                        </span>
                        <div className="flex gap-1.5">
                          <span className="h-5 w-5 rounded-full border border-dashed border-border-strong/40 bg-transparent" />
                          <span className="h-5 w-5 rounded-full border border-dashed border-border-strong/40 bg-transparent" />
                        </div>
                      </div>
                    </div>
                  </ProfileSection>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="flex flex-col gap-6">
                  <ProfileSection
                    title="Session"
                    description="Manage your active session and sign-in method."
                  >
                    <ProfileRow
                      label="Sign-in method"
                      description="You authenticate with your Google account"
                    >
                      <Badge variant="outline" className="border-border-default capitalize">
                        {profile.authProvider}
                      </Badge>
                    </ProfileRow>
                    <ProfileRow
                      label="Account created"
                      description="When you first joined Supereye"
                    >
                      <span className="text-[13px] text-text-secondary">{memberSince}</span>
                    </ProfileRow>
                  </ProfileSection>

                  <ProfileSection
                    title="Sign out"
                    description="End your current session on this device."
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[13px] text-text-muted">
                        You will be returned to the login page. Unsaved drafts may be lost.
                      </p>
                      <Button
                        variant="destructive"
                        className="gap-2 shrink-0"
                        onClick={() => signOut({ callbackUrl: '/' })}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </ProfileSection>

                  <DeleteAccountSection email={profile.email} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
