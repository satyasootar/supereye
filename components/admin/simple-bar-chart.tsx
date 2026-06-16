'use client';

import { cn } from '@/lib/utils';

import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatChartDayLabel, seriesHasActivity } from '@/lib/billing/chart-series';

function EmptyChart({ message }: { message: string }) {
  return <p className="text-sm text-text-muted">{message}</p>;
}

export function SimpleBarChart({
  data,
  valueFormatter = (v) => String(v),
  className,
  emptyMessage = 'No data for this period.',
  showWhenZero = true,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (value: number) => string;
  className?: string;
  emptyMessage?: string;
  showWhenZero?: boolean;
}) {
  if (data.length === 0 || (!showWhenZero && !seriesHasActivity(data))) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <ChartContainer
      config={{
        value: {
          label: 'Value',
          color: 'var(--accent-blue)',
        },
      }}
      className={cn('h-[250px] w-full', className)}
    >
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          tickFormatter={valueFormatter}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function SimpleLineChart({
  data,
  className,
  valueFormatter,
  emptyMessage = 'No data for this period.',
  showWhenZero = true,
}: {
  data: { label: string; value: number }[];
  className?: string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  showWhenZero?: boolean;
}) {
  if (data.length === 0 || (!showWhenZero && !seriesHasActivity(data))) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <ChartContainer
      config={{
        value: {
          label: 'Value',
          color: 'var(--accent-blue)',
        },
      }}
      className={cn('h-[250px] w-full', className)}
    >
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
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
          tickFormatter={valueFormatter}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function SimpleAreaChart({
  data,
  className,
  valueFormatter,
  emptyMessage = 'No data for this period.',
  showWhenZero = true,
}: {
  data: { label: string; value: number }[];
  className?: string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  showWhenZero?: boolean;
}) {
  if (data.length === 0 || (!showWhenZero && !seriesHasActivity(data))) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <ChartContainer
      config={{
        value: {
          label: 'Value',
          color: 'var(--accent-blue)',
        },
      }}
      className={cn('h-[250px] w-full', className)}
    >
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="adminTokenFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
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
          tickFormatter={valueFormatter}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="url(#adminTokenFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function toDayChartData(points: { day: string; value: number }[]) {
  return points.map((point) => ({
    label: formatChartDayLabel(point.day),
    value: point.value,
  }));
}
