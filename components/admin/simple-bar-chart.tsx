'use client';

import { cn } from '@/lib/utils';

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function SimpleBarChart({
  data,
  valueFormatter = (v) => String(v),
  className,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (value: number) => string;
  className?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No data for this period.</p>;
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
}: {
  data: { label: string; value: number }[];
  className?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No data for this period.</p>;
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
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
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
