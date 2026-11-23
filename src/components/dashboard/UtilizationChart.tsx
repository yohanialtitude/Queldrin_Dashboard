import React, { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SegmentedTabs } from '../ui/SegmentedTabs';
import { useTheme } from '../../contexts/ThemeContext';
import type { UtilizationPoint } from '../../types/infrastructure';
import { CHART_COLORS, chartTheme } from '../../utils/chartTheme';

type Metric = 'utilization' | 'allocated' | 'queued';

const metricMeta: Record<Metric, {label: string;color: string;unit: string;}> = {
  utilization: { label: 'Utilization', color: CHART_COLORS.copper, unit: '%' },
  allocated: { label: 'Allocated GPUs', color: CHART_COLORS.teal, unit: ' GPUs' },
  queued: { label: 'Queue depth', color: CHART_COLORS.blue, unit: ' jobs' }
};

interface UtilizationChartProps {
  data: UtilizationPoint[];
  periodLabel: string;
}

export function UtilizationChart({ data, periodLabel }: UtilizationChartProps) {
  const [metric, setMetric] = useState<Metric>('utilization');
  const { theme } = useTheme();
  const t = chartTheme(theme === 'dark');
  const meta = metricMeta[metric];
  const values = data.map((d) => d[metric]);
  const avg = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
  const peak = values.length ? Math.max(...values) : 0;

  return (
    <section className="card flex min-w-0 flex-col p-5 sm:p-6" aria-labelledby="util-title">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 id="util-title" className="font-display text-xl font-semibold text-ink">Recorded utilization</h2>
          <p className="mt-1 text-sm text-ink-soft">Daily cluster summary · {periodLabel}</p>
        </div>
        <SegmentedTabs
          label="Chart metric"
          value={metric}
          onChange={setMetric}
          options={[
          { value: 'utilization', label: 'Utilization' },
          { value: 'allocated', label: 'Allocated' },
          { value: 'queued', label: 'Queue' }]
          } />
        
      </div>
      <div className="mt-5 flex gap-8">
        <div>
          <p className="text-xs text-ink-soft">Average</p>
          <p className="text-2xl font-semibold text-ink tabular-nums">{avg}{meta.unit}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">Peak</p>
          <p className="text-2xl font-semibold text-ink tabular-nums">{peak}{meta.unit}</p>
        </div>
      </div>
      <div className="mt-4 h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: t.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fill: t.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={t.tooltip} formatter={(v: number) => [`${v}${meta.unit}`, meta.label]} cursor={{ stroke: t.grid }} />
            <Area type="monotone" dataKey={metric} stroke={meta.color} strokeWidth={2.5} fill={meta.color} fillOpacity={0.12} animationDuration={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>);

}