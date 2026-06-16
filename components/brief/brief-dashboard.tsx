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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSSE } from '@/hooks/use-sse';
import { useAppStore } from '@/lib/store/app-store';
import type { BriefActionItem, BriefEmailInsight, BriefEventItem, BriefGithubItem, BriefPayload } from '@/lib/brief/types';
import { inferActionSourcePlugin } from '@/lib/brief/types';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import { INSIGHT_CATEGORY_LABELS } from '@/lib/brief/types';

function StatChip({
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
    <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface/60 px-4 py-3 backdrop-blur-sm">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          accent ?? 'bg-accent-blue/10 text-accent-blue'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-mono text-xl font-semibold tabular-nums text-text-primary">{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      </div>
    </div>
  );
}

function CopyOtpButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 font-mono">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : code}
    </Button>
  );
}

function JoinButton({ url, label = 'Join' }: { url: string; label?: string }) {
  return (
    <Button
      size="sm"
      className="gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90"
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Video className="h-3.5 w-3.5" />
        {label}
      </a>
    </Button>
  );
}

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
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg-surface text-text-muted">
        <Plus className="h-3 w-3" />
      </div>
    );
  }

  const pluginId = action ? inferActionSourcePlugin(action) : null;

  if (pluginId) {
    return (
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <PluginBrandIcon pluginId={pluginId} size={18} />
      </div>
    );
  }

  if (action?.id.startsWith('ai-')) {
    return (
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
        <Sparkles className="h-3 w-3" />
      </div>
    );
  }

  return null;
}

function EventRow({ event }: { event: BriefEventItem }) {
  const time = new Date(event.startTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
        event.isHappeningNow
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : 'border-border-subtle bg-bg-elevated/50'
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{event.title}</p>
        <p className="text-xs text-text-muted">
          {time}
          {event.isHappeningNow && (
            <span className="ml-2 font-medium text-emerald-500">· Live now</span>
          )}
          {!event.isHappeningNow && event.minutesUntilStart != null && event.minutesUntilStart > 0 && (
            <span className="ml-2">· in {event.minutesUntilStart}m</span>
          )}
        </p>
      </div>
      {event.meetUrl ? (
        <JoinButton url={event.meetUrl} label={event.isHappeningNow ? 'Join now' : 'Join'} />
      ) : event.htmlLink ? (
        <Button size="sm" variant="outline" asChild>
          <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function EmailInsightRow({
  email,
  onOpen,
}: {
  email: BriefEmailInsight;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(email.id)}
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-border-subtle bg-bg-elevated/40 px-4 py-3 text-left transition-colors hover:border-accent-blue/30 hover:bg-bg-elevated"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {email.priorityTier === 'urgent' && (
            <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-400">
              Urgent
            </span>
          )}
          <span className="rounded-md bg-bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
            {INSIGHT_CATEGORY_LABELS[email.category]}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-text-primary">
          {email.subject || '(No subject)'}
        </p>
        <p className="truncate text-xs text-text-muted">{email.insightSummary ?? email.snippet}</p>
      </div>
      {email.links[0] ? (
        <JoinButton url={email.links[0].url} label="Join" />
      ) : email.otps[0] ? (
        <CopyOtpButton code={email.otps[0].code} />
      ) : null}
    </button>
  );
}

function GithubItemRow({ item }: { item: BriefGithubItem }) {
  const Icon = item.kind === 'pull' ? GitPullRequest : CircleDot;
  const typeLabel = item.kind === 'pull' ? 'PR' : 'Issue';

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-elevated/40 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
            {typeLabel}
          </span>
          {item.draft && (
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              Draft
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-medium text-text-primary">{item.title}</p>
        <p className="truncate text-xs text-text-muted">
          {item.repoFullName} #{item.number}
          {item.authorLogin ? ` · @${item.authorLogin}` : ''}
        </p>
      </div>
      {item.htmlUrl ? (
        <Button size="sm" variant="outline" asChild>
          <a href={item.htmlUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            Open
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  empty?: string;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <section className="rounded-2xl border border-border-subtle bg-bg-surface/30 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent-blue" />
        <h2 className="font-heading text-base font-semibold text-text-primary">{title}</h2>
      </div>
      {isEmpty ? (
        <p className="text-sm text-text-muted">{empty ?? 'Nothing here right now.'}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

export function BriefDashboard() {
  useSSE();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSelectedEmailId = useAppStore((s) => s.setSelectedEmailId);

  const [syncError, setSyncError] = useState<string | null>(null);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [customTodoTitle, setCustomTodoTitle] = useState('');

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

        let mailRes: Response | null = null;
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

        await Promise.all(syncTasks);

        if (mailRes && !mailRes.ok) {
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-bg-app">
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
          <h1 className="hidden text-[15px] font-semibold text-text-primary sm:block">Today</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AI summary
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          {/* Header */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-blue">
              Daily command center
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              {brief?.greeting ?? 'Good day'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {brief?.generatedAt
                ? `Updated ${new Date(brief.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : 'Loading your day…'}
            </p>
          </div>

          {syncError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {syncError}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
            </div>
          )}

          {brief && (
            <>
              {/* Stats — only for connected plugins */}
              {(hasEmail || hasCalendar || hasGithub) && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {hasEmail && (
                    <>
                      <StatChip label="Unread" value={brief.stats.unreadInbox} icon={Mail} />
                      <StatChip
                        label="Urgent"
                        value={brief.triage.urgent}
                        icon={AlertTriangle}
                        accent="bg-red-500/10 text-red-400"
                      />
                    </>
                  )}
                  {hasCalendar && (
                    <StatChip
                      label="Meetings"
                      value={brief.stats.meetingsToday}
                      icon={Calendar}
                      accent="bg-violet-500/10 text-violet-400"
                    />
                  )}
                  {hasEmail && (
                    <StatChip
                      label="OTP codes"
                      value={brief.stats.otpsToday}
                      icon={KeyRound}
                      accent="bg-amber-500/10 text-amber-400"
                    />
                  )}
                  {hasGithub && brief.github && (
                    <>
                      <StatChip
                        label="Open PRs"
                        value={brief.github.stats.openPulls}
                        icon={GitPullRequest}
                        accent="bg-emerald-500/10 text-emerald-400"
                      />
                      <StatChip
                        label="Open issues"
                        value={brief.github.stats.openIssues}
                        icon={CircleDot}
                        accent="bg-accent-blue/10 text-accent-blue"
                      />
                    </>
                  )}
                </div>
              )}

              {/* AI narrative */}
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-bg-surface/80 to-cyan-500/10 p-6">
                <Sparkles className="absolute right-4 top-4 h-5 w-5 text-violet-400/50" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-violet-400">
                  AI briefing
                </p>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-primary">
                  {brief.narrative ??
                    (connected.size === 0
                      ? 'Connect Gmail, Calendar, or GitHub in settings, then tap “AI summary” for a personalized plan.'
                      : 'Tap “AI summary” to generate a personalized plan based on your connected plugins.')}
                </p>
                {generateMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(generateMutation.error as Error).message}
                  </p>
                )}
              </div>

              <section className="rounded-2xl border border-border-subtle bg-bg-surface/30 p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-semibold text-text-primary">What to do</h2>
                  <p className="text-xs text-text-muted">
                    {todoItems.filter((t) => t.completed).length}/{todoItems.length} done
                  </p>
                </div>

                <div className="mb-4 flex gap-2">
                  <input
                    value={customTodoTitle}
                    onChange={(e) => setCustomTodoTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCustomTodo();
                    }}
                    placeholder="Add your own todo..."
                    className="h-9 flex-1 rounded-lg border border-border-subtle bg-bg-elevated/40 px-3 text-sm text-text-primary outline-none ring-0 placeholder:text-text-muted focus:border-accent-blue/40"
                  />
                  <Button size="sm" onClick={addCustomTodo} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>

                {todoItems.length === 0 ? (
                  <p className="text-sm text-text-muted">No todos right now. Add one above.</p>
                ) : (
                  <div className="space-y-2">
                    {todoItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'rounded-xl border px-4 py-3',
                          item.completed
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border-subtle bg-bg-elevated/40'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTodo(item.id)}
                            className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                          >
                            {item.completed ? (
                              <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                            )}
                            <TodoSourceIcon action={item.action} isCustom={item.isCustom} />
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  item.completed ? 'text-text-muted line-through' : 'text-text-primary'
                                )}
                              >
                                {item.title}
                              </p>
                              {item.description && (
                                <p
                                  className={cn(
                                    'text-xs',
                                    item.completed
                                      ? 'text-text-muted/80 line-through'
                                      : 'text-text-muted'
                                  )}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </button>

                          {item.action?.kind === 'join_meeting' && item.action.meetUrl ? (
                            <JoinButton url={item.action.meetUrl} />
                          ) : item.action?.kind === 'copy_otp' && item.action.otpCode ? (
                            <CopyOtpButton code={item.action.otpCode} />
                          ) : item.action?.href ? (
                            item.action.href.startsWith('http') ? (
                              <Button size="sm" variant="outline" asChild>
                                <a
                                  href={item.action.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open
                                </a>
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={item.action.href}>Open</Link>
                              </Button>
                            )
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Main grid — plugin-aware sections */}
              <div className="grid gap-5 lg:grid-cols-2">
                {hasCalendar && (
                  <Section
                    title="Today's schedule"
                    icon={Calendar}
                    empty="No events today. Your calendar is clear."
                  >
                    {brief.todayEvents.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </Section>
                )}

                {hasEmail && (
                  <Section
                    title="Urgent mail"
                    icon={AlertTriangle}
                    empty="No urgent emails. You're caught up."
                  >
                    {brief.urgentEmails.map((e) => (
                      <EmailInsightRow key={e.id} email={e} onOpen={openEmail} />
                    ))}
                  </Section>
                )}

                {hasGithub && brief.github && (
                  <Section
                    title="GitHub — needs attention"
                    icon={GitPullRequest}
                    empty="No open pull requests or issues need attention."
                  >
                    {brief.github.attentionItems.map((item) => (
                      <GithubItemRow
                        key={`${item.kind}-${item.repoFullName}-${item.number}`}
                        item={item}
                      />
                    ))}
                  </Section>
                )}

                {hasEmail && (
                  <Section
                    title="Verification codes"
                    icon={KeyRound}
                    empty="No OTP emails in your inbox."
                  >
                    {(brief.emailsByCategory.otp ?? []).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-elevated/40 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.subject}</p>
                          <p className="truncate text-xs text-text-muted">{e.sender}</p>
                        </div>
                        {e.otps[0] && <CopyOtpButton code={e.otps[0].code} />}
                      </div>
                    ))}
                  </Section>
                )}

                {hasEmail && (
                  <Section
                    title="Bank & finance"
                    icon={Landmark}
                    empty="No bank or payment alerts."
                  >
                    {(brief.emailsByCategory.bank ?? []).map((e) => (
                      <EmailInsightRow key={e.id} email={e} onOpen={openEmail} />
                    ))}
                  </Section>
                )}

                {hasEmail && (
                  <Section
                    title="Meetings in mail"
                    icon={Video}
                    empty="No meeting invites in inbox."
                  >
                    {(brief.emailsByCategory.meeting ?? []).map((e) => (
                      <EmailInsightRow key={e.id} email={e} onOpen={openEmail} />
                    ))}
                  </Section>
                )}

                <Section title="Connected plugins" icon={Sparkles}>
                  <div className="flex flex-wrap gap-2">
                    {brief.plugins.map((p) => (
                      <span
                        key={p.id}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs',
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
                </Section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
