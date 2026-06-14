'use client';

import { useCallback, useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { WorkspaceLayoutSection } from '@/components/profile/workspace-layout-section';
import { DeleteAccountSection } from '@/components/profile/delete-account-section';
import { getPlugin } from '@/lib/plugins/registry';
import { useAppStore } from '@/lib/store/app-store';
import type { UserProfile } from '@/lib/user/profile';

type ProfileTab = 'account' | 'connections' | 'workspace' | 'appearance' | 'security';

const TABS: { id: ProfileTab; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'workspace', label: 'Workspace', icon: LayoutPanelLeft },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
];

type ProfilePageClientProps = {
  profile: UserProfile;
};

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { leftSidebarCollapsed, setLeftSidebarCollapsed } = useAppStore();

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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
              {activeTab === 'account' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-5 rounded-xl border border-border-default bg-bg-elevated p-6">
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

              {activeTab === 'appearance' && (
                <ProfileSection
                  title="Appearance"
                  description="Customize how Supereye looks on your device."
                >
                  <ProfileRow label="Theme" description="Choose your preferred color scheme">
                    <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-surface p-1">
                      {(
                        [
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor },
                        ] as const
                      ).map((option) => {
                        const Icon = option.icon;
                        const isActive = theme === option.value;
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
