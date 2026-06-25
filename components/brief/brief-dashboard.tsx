'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  RefreshCw,
  Video,
  Mail,
  KeyRound,
  Landmark,
  Calendar,
  ArrowLeft,
  Copy,
  Check,
  Circle,
  CircleCheckBig,
  Plus,
  AlertTriangle,
  Loader2,
  GitPullRequest,
  CircleDot,
  HardDrive,
  Star,
  Folder,
  FileText,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSSE } from '@/hooks/use-sse';
import { useAppStore } from '@/lib/store/app-store';
import type {
  BriefActionItem,
  BriefDriveItem,
  BriefEmailInsight,
  BriefEventItem,
  BriefGithubItem,
  BriefPayload,
} from '@/lib/brief/types';
import { inferActionSourcePlugin } from '@/lib/brief/types';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import { INSIGHT_CATEGORY_LABELS } from '@/lib/brief/types';

/* ─── Primitives ─────────────────────────────────────────────── */

function StatPill({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/60 px-3 py-1.5">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', accent ?? 'text-accent-blue')} />
      <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}

function CopyOtpButton({ code, compact }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        className="group flex w-full flex-col items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/8 px-2 py-2 transition-colors hover:border-amber-500/40 hover:bg-amber-500/12"
      >
        <span className="font-mono text-lg font-bold tracking-widest text-amber-400">{code}</span>
        <span className="flex items-center gap-1 text-[10px] text-text-muted group-hover:text-text-secondary">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Tap to copy'}
        </span>
      </button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 font-mono shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : code}
    </Button>
  );
}

function JoinButton({ url, label = 'Join', size = 'sm' }: { url: string; label?: string; size?: 'sm' | 'xs' }) {
  return (
    <Button
      size={size === 'xs' ? 'sm' : 'sm'}
      className={cn(
        'gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90 shrink-0',
        size === 'xs' && 'h-7 px-2 text-xs'
      )}
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Video className="h-3 w-3" />
        {label}
      </a>
    </Button>
  );
}

function PanelHeader({
  title,
  icon: Icon,
  trailing,
  accent,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md',
            accent ?? 'bg-accent-blue/10 text-accent-blue'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="font-heading text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {trailing}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle py-6 text-center">
      <p className="text-xs text-text-muted">{message}</p>
    </div>
  );
}

/* ─── Progress ring ──────────────────────────────────────────── */

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-border-subtle" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-500"
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold text-text-primary">
        {done}/{total}
      </span>
    </div>
  );
}

/* ─── Row components ─────────────────────────────────────────── */

type TodoItem = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  action?: BriefActionItem;
  isCustom?: boolean;
};

function TodoSourceIcon({ action, isCustom }: { action?: BriefActionItem; isCustom?: boolean }) {
  if (isCustom) {
    return (
      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-bg-surface text-text-muted">
        <Plus className="h-2.5 w-2.5" />
      </div>
    );
  }

  const pluginId = action ? inferActionSourcePlugin(action) : null;

  if (pluginId) {
    return (
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        <PluginBrandIcon pluginId={pluginId} size={14} />
      </div>
    );
  }

  if (action?.id.startsWith('ai-')) {
    return (
      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-violet-500/10 text-violet-400">
        <Sparkles className="h-2.5 w-2.5" />
      </div>
    );
  }

  return null;
}

function EventTimelineItem({ event, isLast }: { event: BriefEventItem; isLast: boolean }) {
  const time = new Date(event.startTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-bg-surface',
            event.isHappeningNow
              ? 'bg-emerald-500 ring-emerald-500/40 animate-pulse'
              : 'bg-accent-blue ring-accent-blue/30'
          )}
        />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border-subtle" />}
      </div>
      <div
        className={cn(
          'mb-3 min-w-0 flex-1 rounded-lg border px-3 py-2',
          event.isHappeningNow
            ? 'border-emerald-500/35 bg-emerald-500/8'
            : 'border-border-subtle bg-bg-elevated/50'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{event.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
              <Clock className="h-3 w-3 shrink-0" />
              {time}
              {event.isHappeningNow && (
                <span className="font-medium text-emerald-500">· Live</span>
              )}
              {!event.isHappeningNow && event.minutesUntilStart != null && event.minutesUntilStart > 0 && (
                <span>· in {event.minutesUntilStart}m</span>
              )}
            </p>
          </div>
          {event.meetUrl ? (
            <JoinButton url={event.meetUrl} label={event.isHappeningNow ? 'Join' : 'Join'} size="xs" />
          ) : event.htmlLink ? (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs shrink-0" asChild>
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UrgentEmailCard({
  email,
  onOpen,
}: {
  email: BriefEmailInsight;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(email.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(email.id);
        }
      }}
      className="group flex w-full flex-col rounded-lg border border-border-subtle bg-bg-elevated/40 p-3 text-left transition-all hover:border-red-500/30 hover:bg-bg-elevated hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {email.priorityTier === 'urgent' && (
              <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-400">
                Urgent
              </span>
            )}
            <span className="rounded bg-bg-surface px-1.5 py-0.5 text-[9px] text-text-muted">
              {INSIGHT_CATEGORY_LABELS[email.category]}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-1 text-sm font-medium text-text-primary group-hover:text-accent-blue">
            {email.subject || '(No subject)'}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-text-muted">
            {email.insightSummary ?? email.snippet}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {(email.links[0] || email.otps[0]) && (
        <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {email.links[0] ? (
            <JoinButton url={email.links[0].url} label="Join" size="xs" />
          ) : email.otps[0] ? (
            <CopyOtpButton code={email.otps[0].code} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function CompactEmailRow({
  email,
  onOpen,
}: {
  email: BriefEmailInsight;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(email.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(email.id);
        }
      }}
      className="flex w-full items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated/30 px-2.5 py-2 text-left transition-colors hover:border-accent-blue/25 hover:bg-bg-elevated cursor-pointer"
    >
      <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-text-primary">{email.subject || '(No subject)'}</p>
        <p className="truncate text-[10px] text-text-muted">{email.sender}</p>
      </div>
      {email.links[0] ? (
        <JoinButton url={email.links[0].url} label="Join" size="xs" />
      ) : email.otps[0] ? (
        <CopyOtpButton code={email.otps[0].code} />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      )}
    </div>
  );
}

function GithubCompactCard({ item }: { item: BriefGithubItem }) {
  const Icon = item.kind === 'pull' ? GitPullRequest : CircleDot;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated/30 px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-text-primary">{item.title}</p>
        <p className="truncate text-[10px] text-text-muted">
          {item.repoFullName} #{item.number}
        </p>
      </div>
      {item.htmlUrl && (
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" asChild>
          <a href={item.htmlUrl} target="_blank" rel="noopener noreferrer">
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      )}
    </div>
  );
}

function DriveCompactCard({ item }: { item: BriefDriveItem }) {
  const Icon = item.isFolder ? Folder : FileText;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated/30 px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-sky-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-text-primary">{item.name}</p>
        <p className="truncate text-[10px] text-text-muted">
          {item.isFolder ? 'Folder' : item.fileExtension?.toUpperCase() ?? 'File'}
          {item.starred && ' · ★'}
        </p>
      </div>
      {item.webViewLink && (
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" asChild>
          <a href={item.webViewLink} target="_blank" rel="noopener noreferrer">
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      )}
    </div>
  );
}

type MailTab = 'otp' | 'bank' | 'meeting';

/* ─── Main dashboard ─────────────────────────────────────────── */

export function BriefDashboard() {
  useSSE();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSelectedEmailId = useAppStore((s) => s.setSelectedEmailId);

  const [syncError, setSyncError] = useState<string | null>(null);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [customTodoTitle, setCustomTodoTitle] = useState('');
  const [mailTab, setMailTab] = useState<MailTab>('otp');

  const { data, isLoading, refetch, isFetching } = useQuery<{ brief: BriefPayload }>({
    queryKey: ['brief', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/brief/today');
      if (!res.ok) throw new Error('Failed to load brief');
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/brief/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Generation failed');
      }
      return res.json() as Promise<{ brief: BriefPayload }>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['brief', 'today'], result);
    },
  });

  useEffect(() => {
    const sync = async () => {
      try {
        const briefRes = await fetch('/api/brief/today');
        const briefJson = briefRes.ok
          ? ((await briefRes.json()) as { brief?: BriefPayload })
          : null;
        const connected = briefJson?.brief?.connectedPluginIds ?? [];

        if (connected.length === 0) return;

        let mailRes: Response | undefined;
        const syncTasks: Promise<void>[] = [];

        if (connected.includes('email')) {
          syncTasks.push(
            fetch('/api/mail/sync', { method: 'POST' }).then((res) => {
              mailRes = res;
            })
          );
        }
        if (connected.includes('calendar')) {
          syncTasks.push(fetch('/api/calendar/sync', { method: 'POST' }).then(() => undefined));
        }
        if (connected.includes('github')) {
          syncTasks.push(fetch('/api/github/sync', { method: 'POST' }).then(() => undefined));
        }
        if (connected.includes('drive')) {
          syncTasks.push(fetch('/api/drive/sync', { method: 'POST' }).then(() => undefined));
        }

        await Promise.all(syncTasks);

        if (mailRes !== undefined && !mailRes.ok) {
          const err = await mailRes.json().catch(() => ({}));
          setSyncError(
            typeof err.error === 'string'
              ? err.error
              : 'Mail sync failed. Try refreshing or reconnect Gmail in settings.'
          );
          return;
        }

        setSyncError(null);
        await queryClient.invalidateQueries({ queryKey: ['brief', 'today'] });
      } catch {
        setSyncError('Could not reach sync services. Check your connection and try again.');
      }
    };
    void sync();
  }, [queryClient]);

  const openEmail = useCallback(
    (id: string) => {
      setSelectedEmailId(id);
      router.push('/workspace');
    },
    [router, setSelectedEmailId]
  );

  const brief = data?.brief;
  const connected = useMemo(
    () => new Set(brief?.connectedPluginIds ?? []),
    [brief?.connectedPluginIds]
  );
  const hasEmail = connected.has('email');
  const hasCalendar = connected.has('calendar');
  const hasGithub = connected.has('github');
  const hasDrive = connected.has('drive');
  const loadedActionItems = useMemo(() => brief?.actionItems ?? [], [brief?.actionItems]);

  useEffect(() => {
    if (loadedActionItems.length === 0) return;
    setTodoItems((prev) => {
      const customItems = prev.filter((item) => item.isCustom);
      const completionMap = new Map(prev.map((item) => [item.id, item.completed]));
      const mapped = loadedActionItems.map((item) => ({
        id: `action-${item.id}`,
        title: item.title,
        description: item.description,
        completed: completionMap.get(`action-${item.id}`) ?? false,
        action: item,
      }));
      return [...mapped, ...customItems];
    });
  }, [loadedActionItems]);

  const toggleTodo = useCallback((id: string) => {
    setTodoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }, []);

  const addCustomTodo = useCallback(() => {
    const title = customTodoTitle.trim();
    if (!title) return;
    setTodoItems((prev) => [
      ...prev,
      {
        id: `custom-${crypto.randomUUID()}`,
        title,
        completed: false,
        isCustom: true,
      },
    ]);
    setCustomTodoTitle('');
  }, [customTodoTitle]);

  const doneCount = todoItems.filter((t) => t.completed).length;
  const otpEmails = brief?.emailsByCategory.otp ?? [];
  const bankEmails = brief?.emailsByCategory.bank ?? [];
  const meetingEmails = brief?.emailsByCategory.meeting ?? [];

  const mailTabCounts = { otp: otpEmails.length, bank: bankEmails.length, meeting: meetingEmails.length };
  const activeMailItems =
    mailTab === 'otp' ? otpEmails : mailTab === 'bank' ? bankEmails : meetingEmails;

  const mailTabs: { id: MailTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'otp', label: 'Codes', icon: KeyRound },
    { id: 'bank', label: 'Finance', icon: Landmark },
    { id: 'meeting', label: 'Invites', icon: Video },
  ];

  const showAiSummaryButton =
    Boolean(brief) && connected.size > 0 && !brief?.narrative && !generateMutation.isPending;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-bg-app">
      {/* Toolbar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-highlight px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>
          <h1 className="font-heading text-sm font-semibold text-text-primary">One View</h1>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 gap-1 px-2 text-xs"
          >
            <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-5">
          {syncError && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {syncError}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          )}

          {brief && (
            <div className="space-y-4">
              {/* Hero band: greeting + stats + AI narrative */}
              <div>
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                    {brief.greeting}
                  </h2>
                  <span className="text-xs text-text-muted">
                    {brief.generatedAt
                      ? `Updated ${new Date(brief.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                      : 'Loading…'}
                  </span>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                  {/* AI narrative */}
                  <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/8 via-bg-surface/60 to-cyan-500/8 px-4 py-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                            AI briefing
                          </p>
                          {showAiSummaryButton && (
                            <Button
                              size="sm"
                              onClick={() => generateMutation.mutate()}
                              className="h-7 shrink-0 gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 px-2.5 text-xs text-white hover:opacity-90"
                            >
                              <Sparkles className="h-3 w-3" />
                              AI summary
                            </Button>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-text-primary">
                          {generateMutation.isPending ? (
                            <span className="inline-flex items-center gap-2 text-text-muted">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Generating your briefing…
                            </span>
                          ) : (
                            brief.narrative ??
                            (connected.size === 0
                              ? 'Connect Gmail, Calendar, GitHub, or Drive in settings to unlock a personalized daily briefing.'
                              : 'Generate a personalized plan from your connected plugins.')
                          )}
                        </p>
                        {generateMutation.isError && (
                          <p className="mt-1.5 text-xs text-destructive">
                            {(generateMutation.error as Error).message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Stats strip */}
                {(hasEmail || hasCalendar || hasGithub || hasDrive) && (
                  <div className="flex flex-wrap content-start gap-2 lg:justify-end xl:max-w-md">
                    {hasEmail && (
                      <>
                        <StatPill label="Unread" value={brief.stats.unreadInbox} icon={Mail} />
                        <StatPill
                          label="Urgent"
                          value={brief.triage.urgent}
                          icon={AlertTriangle}
                          accent="text-red-400"
                        />
                        <StatPill
                          label="OTPs"
                          value={brief.stats.otpsToday}
                          icon={KeyRound}
                          accent="text-amber-400"
                        />
                      </>
                    )}
                    {hasCalendar && (
                      <StatPill
                        label="Meetings"
                        value={brief.stats.meetingsToday}
                        icon={Calendar}
                        accent="text-violet-400"
                      />
                    )}
                    {hasGithub && brief.github && (
                      <>
                        <StatPill
                          label="PRs"
                          value={brief.github.stats.openPulls}
                          icon={GitPullRequest}
                          accent="text-emerald-400"
                        />
                        <StatPill
                          label="Issues"
                          value={brief.github.stats.openIssues}
                          icon={CircleDot}
                          accent="text-accent-blue"
                        />
                      </>
                    )}
                    {hasDrive && brief.drive && (
                      <StatPill
                        label="Files"
                        value={brief.drive.stats.recentCount}
                        icon={HardDrive}
                        accent="text-sky-400"
                      />
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* Main content layout */}
              <div className="space-y-3">
                {/* Top Row: Focus + Email */}
                <div className="grid gap-3 lg:grid-cols-12">
                  {/* Column 1: Action items */}
                  <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 lg:col-span-5 flex flex-col">
                  <PanelHeader
                    title="Focus"
                    icon={CircleCheckBig}
                    accent="bg-emerald-500/10 text-emerald-500"
                    trailing={<ProgressRing done={doneCount} total={todoItems.length} />}
                  />

                  <div className="mb-2 flex gap-1.5">
                    <input
                      value={customTodoTitle}
                      onChange={(e) => setCustomTodoTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCustomTodo();
                      }}
                      placeholder="Add a task…"
                      className="h-7 flex-1 rounded-md border border-border-subtle bg-bg-elevated/40 px-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue/40"
                    />
                    <Button size="sm" onClick={addCustomTodo} className="h-7 w-7 p-0">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {todoItems.length === 0 ? (
                    <EmptyState message="No tasks yet. Add one above or generate an AI summary." />
                  ) : (
                    <div className="flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden pr-0.5">
                      {todoItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-md border px-2.5 py-2',
                            item.completed
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-border-subtle bg-bg-elevated/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleTodo(item.id)}
                              className="flex min-w-0 flex-1 items-start gap-2 text-left"
                            >
                              {item.completed ? (
                                <CircleCheckBig className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
                              )}
                              <TodoSourceIcon action={item.action} isCustom={item.isCustom} />
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    'text-xs font-medium leading-snug',
                                    item.completed
                                      ? 'text-text-muted line-through'
                                      : 'text-text-primary'
                                  )}
                                >
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p
                                    className={cn(
                                      'mt-0.5 text-[10px] leading-snug',
                                      item.completed
                                        ? 'text-text-muted/70 line-through'
                                        : 'text-text-muted'
                                    )}
                                  >
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </button>

                            {item.action?.kind === 'join_meeting' && item.action.meetUrl ? (
                              <JoinButton url={item.action.meetUrl} size="xs" />
                            ) : item.action?.kind === 'copy_otp' && item.action.otpCode ? (
                              <CopyOtpButton code={item.action.otpCode} />
                            ) : item.action?.href ? (
                              item.action.href.startsWith('http') ? (
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] shrink-0" asChild>
                                  <a href={item.action.href} target="_blank" rel="noopener noreferrer">
                                    Open
                                  </a>
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] shrink-0" asChild>
                                  <Link href={item.action.href}>Open</Link>
                                </Button>
                              )
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 3: Inbox priorities + tabbed mail */}
                <div className="space-y-3 lg:col-span-7">
                  {hasEmail && (
                    <>
                      <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3">
                        <PanelHeader
                          title="Urgent mail"
                          icon={AlertTriangle}
                          accent="bg-red-500/10 text-red-400"
                          trailing={
                            brief.urgentEmails.length > 0 ? (
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                                {brief.urgentEmails.length}
                              </span>
                            ) : null
                          }
                        />
                        {brief.urgentEmails.length === 0 ? (
                          <EmptyState message="No urgent emails. You're caught up." />
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {brief.urgentEmails.map((e) => (
                              <UrgentEmailCard key={e.id} email={e} onOpen={openEmail} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3">
                        <PanelHeader title="Inbox by type" icon={Mail} />

                        {/* Tab bar */}
                        <div className="mb-2 flex gap-1 rounded-lg border border-border-subtle bg-bg-elevated/30 p-0.5">
                          {mailTabs.map(({ id, label, icon: TabIcon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setMailTab(id)}
                              className={cn(
                                'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors',
                                mailTab === id
                                  ? 'bg-bg-surface text-text-primary shadow-sm'
                                  : 'text-text-muted hover:text-text-secondary'
                              )}
                            >
                              <TabIcon className="h-3 w-3" />
                              {label}
                              {mailTabCounts[id] > 0 && (
                                <span
                                  className={cn(
                                    'rounded-full px-1.5 text-[9px] tabular-nums',
                                    mailTab === id ? 'bg-accent-blue/15 text-accent-blue' : 'bg-bg-surface text-text-muted'
                                  )}
                                >
                                  {mailTabCounts[id]}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {activeMailItems.length === 0 ? (
                          <EmptyState
                            message={
                              mailTab === 'otp'
                                ? 'No verification codes in your inbox.'
                                : mailTab === 'bank'
                                  ? 'No bank or payment alerts.'
                                  : 'No meeting invites in inbox.'
                            }
                          />
                        ) : mailTab === 'otp' ? (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {activeMailItems.map((e) =>
                              e.otps[0] ? (
                                <div key={e.id} className="space-y-1">
                                  <CopyOtpButton code={e.otps[0].code} compact />
                                  <button
                                    type="button"
                                    onClick={() => openEmail(e.id)}
                                    className="w-full truncate text-left text-[10px] text-text-muted hover:text-text-secondary"
                                  >
                                    {e.subject}
                                  </button>
                                </div>
                              ) : (
                                <CompactEmailRow key={e.id} email={e} onOpen={openEmail} />
                              )
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {activeMailItems.map((e) => (
                              <CompactEmailRow key={e.id} email={e} onOpen={openEmail} />
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                </div>

                {/* Bottom Row: Schedule, GitHub, Drive */}
                {/* Column 2: Schedule + integrations */}
                <div className="grid gap-3 lg:grid-cols-3">
                  {hasCalendar && (
                    <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3">
                      <PanelHeader
                        title="Schedule"
                        icon={Calendar}
                        accent="bg-violet-500/10 text-violet-400"
                        trailing={
                          brief.todayEvents.length > 0 ? (
                            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                              {brief.todayEvents.length} today
                            </span>
                          ) : null
                        }
                      />
                      {brief.todayEvents.length === 0 ? (
                        <EmptyState message="No events today. Your calendar is clear." />
                      ) : (
                        <div className="max-h-[280px] overflow-y-auto pr-0.5">
                          {brief.todayEvents.map((e, i) => (
                            <EventTimelineItem
                              key={e.id}
                              event={e}
                              isLast={i === brief.todayEvents.length - 1}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {hasGithub && brief.github && (
                    <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3">
                      <PanelHeader
                        title="GitHub"
                        icon={GitPullRequest}
                        accent="bg-emerald-500/10 text-emerald-400"
                        trailing={
                          <span className="text-[10px] text-text-muted">
                            {brief.github.stats.openPulls} PRs · {brief.github.stats.openIssues} issues
                          </span>
                        }
                      />
                      {brief.github.attentionItems.length === 0 ? (
                        <EmptyState message="Nothing needs attention on GitHub." />
                      ) : (
                        <div className="space-y-1">
                          {brief.github.attentionItems.slice(0, 4).map((item) => (
                            <GithubCompactCard
                              key={`${item.kind}-${item.repoFullName}-${item.number}`}
                              item={item}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {hasDrive && brief.drive && (
                    <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3">
                      <PanelHeader
                        title="Drive"
                        icon={HardDrive}
                        accent="bg-sky-500/10 text-sky-400"
                        trailing={
                          brief.drive.stats.starredCount > 0 ? (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400">
                              <Star className="h-3 w-3" />
                              {brief.drive.stats.starredCount} starred
                            </span>
                          ) : null
                        }
                      />
                      {brief.drive.attentionItems.length === 0 ? (
                        <EmptyState message="No recent files in Drive." />
                      ) : (
                        <div className="space-y-1">
                          {brief.drive.attentionItems.slice(0, 4).map((item) => (
                            <DriveCompactCard key={item.id} item={item} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Connected plugins strip */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface/30 px-3 py-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Plugins
                </span>
                {brief.plugins.map((p) => (
                  <span
                    key={p.id}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px]',
                      p.connected
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-border-subtle text-text-muted'
                    )}
                  >
                    {p.label}
                    {p.connected ? ' · on' : ' · off'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
