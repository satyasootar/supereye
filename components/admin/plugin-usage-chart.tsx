'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatChartDayLabel } from '@/lib/billing/chart-series';
import { cn } from '@/lib/utils';

const PLUGIN_COLORS = [
  'var(--accent-blue)',
  '#22c55e',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
];

type PluginSeries = { key: string; label: string };

export function PluginUsageChart({
  connectionTrend,
  pluginSeries,
  className,
}: {
  connectionTrend: Array<Record<string, string | number>>;
  pluginSeries: PluginSeries[];
  className?: string;
}) {
  if (pluginSeries.length === 0) {
    return <p className="text-sm text-text-muted">No plugin connections yet.</p>;
  }

  const chartData = connectionTrend.map((row) => ({
    ...row,
    label: formatChartDayLabel(String(row.day)),
  }));

  const config = Object.fromEntries(
    pluginSeries.map((series, index) => [
      series.key,
      {
        label: series.label,
        color: PLUGIN_COLORS[index % PLUGIN_COLORS.length],
      },
    ])
  );

  return (
    <ChartContainer config={config} className={cn('h-[300px] w-full', className)}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border-subtle)"
          opacity={0.5}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent labelKey="label" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {pluginSeries.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            stroke={`var(--color-${series.key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
