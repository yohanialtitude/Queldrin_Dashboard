import React from 'react';
import { useNavigate } from 'react-router-dom';
import { environments } from '../../data/options';
import type { Allocation, GpuResource } from '../../types/infrastructure';
import { usedGpus } from '../../utils/scheduling';
import { CHART_COLORS } from '../../utils/chartTheme';

interface EnvironmentCapacityProps {
  resources: GpuResource[];
  allocations: Allocation[];
}

export function EnvironmentCapacity({ resources, allocations }: EnvironmentCapacityProps) {
  const navigate = useNavigate();
  const rows = environments.map((env) => {
    const list = resources.filter((r) => r.environment === env);
    let used = 0;
    let free = 0;
    let down = 0;
    list.forEach((r) => {
      if (r.status !== 'Available') down += r.capacity;else
      {
        const u = Math.min(usedGpus(r.id, allocations), r.capacity);
        used += u;
        free += r.capacity - u;
      }
    });
    return { env, used, free, down, total: used + free + down, nodes: list.length };
  });

  return (
    <section className="card flex min-w-0 flex-col p-5 sm:p-6" aria-labelledby="env-title">
      <h2 id="env-title" className="font-display text-xl font-semibold text-ink">Capacity by environment</h2>
      <p className="mt-1 text-sm text-ink-soft">Allocated, free and unavailable GPUs</p>
      <ul className="mt-5 space-y-4">
        {rows.map((r) =>
        <li key={r.env}>
            <button type="button" onClick={() => navigate(`/app/resources?env=${r.env}`)} className="w-full rounded-lg text-left">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">{r.env}</span>
                <span className="text-ink-soft tabular-nums">
                  <span className="font-semibold text-ink">{r.used}</span> / {r.total} · {r.nodes} nodes
                </span>
              </div>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted">
                {r.total > 0 &&
              <>
                    <span style={{ width: `${r.used / r.total * 100}%`, background: CHART_COLORS.copper }} />
                    <span style={{ width: `${r.free / r.total * 100}%`, background: CHART_COLORS.teal, opacity: 0.55 }} />
                    <span style={{ width: `${r.down / r.total * 100}%`, background: CHART_COLORS.sand }} />
                  </>
              }
              </div>
            </button>
          </li>
        )}
      </ul>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.copper }} />Allocated</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.teal, opacity: 0.55 }} />Free</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.sand }} />Unavailable</span>
      </div>
    </section>);

}