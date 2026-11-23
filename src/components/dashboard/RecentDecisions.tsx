import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { timeAgo } from '../../utils/format';

export function RecentDecisions({ limit = 6 }: {limit?: number;}) {
  const { decisions, workloads, resources } = useData();
  const { openWorkload } = useUI();
  const items = [...decisions].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);

  return (
    <section className="card flex flex-col" aria-labelledby="dec-title">
      <div className="flex items-center justify-between gap-3 p-5 pb-3 sm:p-6 sm:pb-3">
        <div>
          <h2 id="dec-title" className="font-display text-xl font-semibold text-ink">Recent scheduling decisions</h2>
          <p className="mt-1 text-sm text-ink-soft">Approvals, assignments and delays as recorded</p>
        </div>
        <Link to="/app/queue" className="btn-ghost btn-sm">
          Open queue <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {items.map((d) => {
          const w = workloads.find((x) => x.id === d.workloadId);
          const r = resources.find((x) => x.id === d.resourceId);
          return (
            <li key={d.id}>
              <button type="button" onClick={() => w && openWorkload(w.id)} className="grid w-full gap-1 px-5 py-3.5 text-left hover:bg-muted/60 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:gap-4 sm:px-6">
                <span><StatusBadge status={d.decision} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    <span className="font-mono">{d.workloadId}</span> {w ? `· ${w.name}` : ''} {r && <span className="text-ink-soft">→ {r.name}</span>}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">{d.reason}</span>
                </span>
                <span className="text-xs text-ink-soft sm:text-right">
                  {timeAgo(d.at)}
                  <span className="block truncate">{d.decidedBy}</span>
                </span>
              </button>
            </li>);

        })}
      </ul>
    </section>);

}