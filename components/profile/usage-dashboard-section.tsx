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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

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
  data,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof MessageSquare;
  accent?: 'blue' | 'urgent' | 'muted';
  data?: Array<{ date: string; value: number }>;
}) {
  const chartColor =
    accent === 'urgent'
      ? 'var(--priority-urgent)'
      : accent === 'blue'
        ? 'var(--accent-blue)'
        : 'var(--text-muted)';

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-default bg-bg-elevated p-4 shadow-sm flex flex-col justify-between min-h-[120px]">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-1 text-[28px] font-semibold leading-none text-text-primary">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-[12px] text-text-muted">{hint}</p>}
        </div>

      </div>
      {data && data.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none opacity-40">
          <ChartContainer
            config={{ value: { label: label, color: chartColor } }}
            className="h-full w-full"
          >
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient
                  id={`fill-${label.replace(/\s+/g, '')}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                fillOpacity={1}
                fill={`url(#fill-${label.replace(/\s+/g, '')})`}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
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
          data={data.chat.last7Days}
        />
        <StatCard
          label="Tokens used"
          value={formatTokens(data.tokens.total)}
          hint={`${formatTokens(data.tokens.input)} in · ${formatTokens(data.tokens.output)} out`}
          icon={Coins}
          data={data.tokens.last7Days.map((d) => ({ date: d.date, value: d.totalTokens }))}
        />
        <StatCard
          label="Emails classified"
          value={data.emailAi.classifiedTotal}
          hint={`${data.emailAi.classifiedThisWeek} this week`}
          icon={Sparkles}
          accent="blue"
          data={data.emailAi.last7Days}
        />
        <StatCard
          label="AI emails sent"
          value={data.agentEmail.sentViaAgent}
          hint={`${data.agentEmail.sentThisWeek} this week`}
          icon={Send}
          data={data.agentEmail.last7Days}
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
            <ChartContainer
              config={{
                totalTokens: {
                  label: 'Tokens',
                  color: 'var(--accent-blue)',
                },
              }}
              className="h-[250px] w-full"
            >
              <BarChart
                data={data.tokens.byFeature.map((row) => ({
                  feature: FEATURE_LABELS[row.feature] ?? row.feature,
                  totalTokens: row.totalTokens,
                }))}
                layout="vertical"
                margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" opacity={0.5} />
                <YAxis
                  dataKey="feature"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="totalTokens"
                  fill="var(--color-totalTokens)"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ChartContainer>
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
          {data.tokens.last7Days.every((day) => day.totalTokens === 0) ? (
            <p className="text-[13px] text-text-muted">No activity in the last 7 days.</p>
          ) : (
            <ChartContainer
              config={{
                totalTokens: {
                  label: 'Tokens',
                  color: 'var(--accent-blue)',
                },
              }}
              className="h-[250px] w-full"
            >
              <AreaChart
                data={data.tokens.last7Days.map((day) => ({
                  date: format(new Date(`${day.date}T12:00:00`), 'EEE'),
                  fullDate: format(new Date(`${day.date}T12:00:00`), 'MMM d, yyyy'),
                  totalTokens: day.totalTokens,
                }))}
                margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-totalTokens)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-totalTokens)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent labelKey="fullDate" />}
                />
                <Area
                  type="monotone"
                  dataKey="totalTokens"
                  stroke="var(--color-totalTokens)"
                  fillOpacity={1}
                  fill="url(#fillTokens)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
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
