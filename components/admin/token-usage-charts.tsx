'use client';

import { AdminPanel } from '@/components/admin/admin-shell';
import {
  SimpleAreaChart,
  SimpleBarChart,
  SimpleLineChart,
  toDayChartData,
} from '@/components/admin/simple-bar-chart';
import { formatTokens } from '@/lib/billing/format';

const FEATURE_LABELS: Record<string, string> = {
  chat: 'Assistant chat',
  chat_summary: 'Chat summaries',
  email_triage: 'Email triage',
  email_compose_enhance: 'Compose enhance',
  daily_brief: 'Daily brief',
  transcribe: 'Voice transcription',
  agent_email_send: 'AI emails sent',
};

type TokenCharts = {
  llmTokenUsage: { day: string; value: number }[];
  billingCredits: { day: string; value: number }[];
  dailyAiUsage: { day: string; value: number }[];
  tokenByFeature: { label: string; value: number; requests?: number }[];
};

export function AdminTokenUsageCharts({ charts }: { charts: TokenCharts }) {
  const featureData = charts.tokenByFeature.map((row) => ({
    label: FEATURE_LABELS[row.label] ?? row.label,
    value: row.value,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminPanel title="LLM token consumption (30 days)">
        <SimpleAreaChart
          data={toDayChartData(charts.llmTokenUsage)}
          valueFormatter={(value) => formatTokens(value)}
          emptyMessage="No LLM token usage recorded yet."
          showWhenZero={false}
        />
      </AdminPanel>

      <AdminPanel title="Billing credits consumed (30 days)">
        <SimpleLineChart
          data={toDayChartData(charts.billingCredits)}
          valueFormatter={(value) => formatTokens(value)}
          emptyMessage="No billing credits deducted yet (unlimited plans or zero-cost actions)."
          showWhenZero={false}
        />
      </AdminPanel>

      <AdminPanel title="Token usage by feature (30 days)">
        <SimpleBarChart
          data={featureData}
          valueFormatter={(value) => formatTokens(value)}
          emptyMessage="No feature-level token usage yet."
        />
      </AdminPanel>

      <AdminPanel title="Daily AI requests (30 days)">
        <SimpleBarChart
          data={toDayChartData(charts.dailyAiUsage)}
          emptyMessage="No AI requests recorded yet."
          showWhenZero={false}
        />
      </AdminPanel>
    </div>
  );
}
