import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRightIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { CHART_COLORS, chartTheme } from '../../utils/chartTheme';

interface CapacityDonutProps {
  allocated: number;
  available: number;
  unavailable: number;
  utilization: number;
  nodeCount: number;
}

export function CapacityDonut({ allocated, available, unavailable, utilization, nodeCount }: CapacityDonutProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = chartTheme(theme === 'dark');
  const total = allocated + available + unavailable;
  const slices = [
  { name: 'Allocated', value: allocated, color: CHART_COLORS.copper, filter: 'allocated' },
  { name: 'Available', value: available, color: CHART_COLORS.teal, filter: 'Available' },
  { name: 'Maintenance / offline', value: unavailable, color: CHART_COLORS.sand, filter: 'unavailable' }];


  return (
    <section className="card flex min-w-0 flex-col p-5 sm:p-6" aria-labelledby="cap-title">
      <h2 id="cap-title" className="font-display text-xl font-semibold text-ink">GPU capacity</h2>
      <p className="mt-1 text-sm text-ink-soft">{total} GPUs across {nodeCount} registered nodes</p>
      <div className="relative mx-auto mt-4 h-[200px] w-full min-w-0 max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" innerRadius="70%" outerRadius="96%" paddingAngle={2} stroke="none" animationDuration={300}>
              {slices.map((s) =>
              <Cell key={s.name} fill={s.color} />
              )}
            </Pie>
            <Tooltip contentStyle={t.tooltip} formatter={(v: number, n: string) => [`${v} GPUs`, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-ink tabular-nums">{utilization}%</span>
          <span className="text-xs text-ink-soft">allocated</span>
        </div>
      </div>
      <ul className="mt-5 space-y-1">
        {slices.map((s) =>
        <li key={s.name}>
            <button
            type="button"
            onClick={() => navigate(`/app/resources?status=${s.filter}`)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
            
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              <span className="flex-1 text-left text-ink-soft">{s.name}</span>
              <span className="font-semibold text-ink tabular-nums">{s.value}</span>
              <ChevronRightIcon className="h-4 w-4 text-ink-soft" />
            </button>
          </li>
        )}
      </ul>
    </section>);

}