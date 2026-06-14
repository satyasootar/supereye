'use client';

import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Coins,
  Mail,
  Send,
  Loader2,
  Bot,
  Sparkles,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { ProfileSection } from '@/components/profile/profile-section';
import { cn } from '@/lib/utils';
import type { UsageDashboard } from '@/lib/usage/dashboard';

const FEATURE_LABELS: Record<string, string> = {
  chat: 'Assistant chat',
  chat_summary: 'Chat summaries',
  email_triage: 'Email triage',
  transcribe: 'Voice transcription',
  agent_email_send: 'AI emails sent',
};

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof MessageSquare;
  accent?: 'blue' | 'urgent' | 'muted';
}) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-1 text-[28px] font-semibold leading-none text-text-primary">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-[12px] text-text-muted">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            accent === 'urgent'
              ? 'border-[color:var(--priority-urgent)]/25 bg-[color:var(--priority-urgent)]/10 text-[color:var(--priority-urgent)]'
              : accent === 'blue'
                ? 'border-accent-blue/25 bg-accent-blue/10 text-accent-blue'
                : 'border-border-subtle bg-bg-surface text-text-muted'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function TokenBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary">{formatTokens(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-overlay">
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function UsageDashboardSection() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['user', 'usage'],
    queryFn: async () => {
      const res = await fetch('/api/user/usage');
      if (!res.ok) throw new Error('Failed to load usage dashboard');
      return res.json() as Promise<UsageDashboard>;
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <ProfileSection title="Usage dashboard" description="Could not load your AI usage data.">
        <p className="text-[13px] text-destructive">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-[13px] font-medium text-accent-blue hover:underline"
        >
          Try again
        </button>
      </ProfileSection>
    );
  }

  const maxFeatureTokens = Math.max(...data.tokens.byFeature.map((f) => f.totalTokens), 1);
  const maxDayTokens = Math.max(...data.tokens.last7Days.map((d) => d.totalTokens), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-text-primary">Usage dashboard</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            Track AI chat activity, token usage, email triage, and agent-generated mail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg-overlay disabled:opacity-50"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Chat messages"
          value={data.chat.totalMessages}
          hint={`${data.chat.messagesThisWeek} this week`}
          icon={MessageSquare}
          accent="blue"
        />
        <StatCard
          label="Tokens used"
          value={formatTokens(data.tokens.total)}
          hint={`${formatTokens(data.tokens.input)} in · ${formatTokens(data.tokens.output)} out`}
          icon={Coins}
        />
        <StatCard
          label="Emails classified"
          value={data.emailAi.classifiedTotal}
          hint={`${data.emailAi.classifiedThisWeek} this week`}
          icon={Sparkles}
          accent="blue"
        />
        <StatCard
          label="AI emails sent"
          value={data.agentEmail.sentViaAgent}
          hint={`${data.agentEmail.sentThisWeek} this week`}
          icon={Send}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection
          title="Chat activity"
          description="Messages generated across all assistant conversations."
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <p className="text-[12px] text-text-muted">Threads</p>
              <p className="mt-1 text-[22px] font-semibold text-text-primary">
                {data.chat.totalThreads}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <p className="text-[12px] text-text-muted">Your messages</p>
              <p className="mt-1 text-[22px] font-semibold text-text-primary">
                {data.chat.userMessages}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <p className="text-[12px] text-text-muted">Assistant replies</p>
              <p className="mt-1 text-[22px] font-semibold text-text-primary">
                {data.chat.assistantMessages}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <p className="text-[12px] text-text-muted">This week</p>
              <p className="mt-1 text-[22px] font-semibold text-text-primary">
                {data.chat.messagesThisWeek}
              </p>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          title="Token usage"
          description="Breakdown by AI feature. Token tracking starts from when this dashboard was enabled."
        >
          {data.tokens.byFeature.length === 0 ? (
            <p className="text-[13px] text-text-muted">No token usage recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {data.tokens.byFeature.map((row) => (
                <TokenBar
                  key={row.feature}
                  label={`${FEATURE_LABELS[row.feature] ?? row.feature} (${row.count})`}
                  value={row.totalTokens}
                  max={maxFeatureTokens}
                  colorClass="bg-accent-blue"
                />
              ))}
            </div>
          )}
        </ProfileSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection
          title="AI email triage"
          description="Incoming mail classified as urgent or can wait."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <AlertCircle className="h-4 w-4 text-[color:var(--priority-urgent)]" />
                Urgent
              </div>
              <span className="text-[18px] font-semibold text-text-primary">
                {data.emailAi.urgentCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Clock3 className="h-4 w-4 text-[color:var(--priority-low)]" />
                Can wait
              </div>
              <span className="text-[18px] font-semibold text-text-primary">
                {data.emailAi.canWaitCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Mail className="h-4 w-4 text-text-muted" />
                Awaiting classification
              </div>
              <span className="text-[18px] font-semibold text-text-primary">
                {data.emailAi.pendingCount}
              </span>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          title="Token activity (7 days)"
          description="Daily token consumption across all AI features."
        >
          {data.tokens.last7Days.length === 0 ? (
            <p className="text-[13px] text-text-muted">No activity in the last 7 days.</p>
          ) : (
            <div className="space-y-3">
              {data.tokens.last7Days.map((day) => (
                <TokenBar
                  key={day.date}
                  label={format(new Date(`${day.date}T12:00:00`), 'EEE, MMM d')}
                  value={day.totalTokens}
                  max={maxDayTokens}
                  colorClass="bg-[color:var(--priority-ai)]"
                />
              ))}
            </div>
          )}
        </ProfileSection>
      </div>

      <ProfileSection
        title="Chat history"
        description="Your most recent assistant conversations."
      >
        {data.recentThreads.length === 0 ? (
          <p className="text-[13px] text-text-muted">No chats yet. Open the assistant to start one.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {data.recentThreads.map((thread) => (
              <li
                key={thread.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text-primary">
                      {thread.title || 'New chat'}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {thread.messageCount} message{thread.messageCount === 1 ? '' : 's'} ·{' '}
                      {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-text-muted">
                  {format(new Date(thread.createdAt), 'MMM d')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>
    </div>
  );
}
