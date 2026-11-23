import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import type { Workload, WorkloadStatus } from '../../types/infrastructure';
import { STATUS_COLORS, chartTheme } from '../../utils/chartTheme';

const statuses: WorkloadStatus[] = ['Pending', 'Approved', 'Running', 'Completed', 'Failed'];

export function StatusMixChart({ workloads }: {workloads: Workload[];}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = chartTheme(theme === 'dark');
  const data = statuses.map((s) => ({ status: s, count: workloads.filter((w) => w.status === s).length }));

  return (
    <section className="card flex min-w-0 flex-col p-5 sm:p-6" aria-labelledby="mix-title">
      <h2 id="mix-title" className="font-display text-xl font-semibold text-ink">Workload status mix</h2>
      <p className="mt-1 text-sm text-ink-soft">{workloads.length} requests · select a bar to filter</p>
      <div className="mt-4 h-[230px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="status" tick={{ fill: t.axis, fontSize: 12 }} axisLine={false} tickLine={false} width={78} />
            <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.grid, opacity: 0.4 }} formatter={(v: number) => [v, 'Workloads']} />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              barSize={18}
              animationDuration={300}
              className="cursor-pointer"
              onClick={(d) => {
                const status = (d as unknown as {status?: string;}).status;
                if (status) navigate(`/app/workloads?status=${status}`);
              }}
              label={{ position: 'right', fill: t.axis, fontSize: 12 }}>
              
              {data.map((d) =>
              <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>);

}