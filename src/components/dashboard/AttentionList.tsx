import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2Icon } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { timeAgo } from '../../utils/format';

export function AttentionList() {
  const { workloads, allocations, resources } = useData();
  const { openWorkload } = useUI();
  const navigate = useNavigate();

  const items = [
  ...workloads.filter((w) => w.status === 'Failed').map((w) => ({
    id: `f-${w.id}`, badge: 'Failed', title: `${w.id} · ${w.name}`, detail: w.error ?? '', at: w.completedAt ?? w.createdAt, onClick: () => openWorkload(w.id)
  })),
  ...allocations.filter((a) => a.conflict && a.releasedAt === null).map((a) => ({
    id: `c-${a.id}`, badge: 'Conflict', title: `${a.workloadId} → ${resources.find((r) => r.id === a.resourceId)?.name ?? ''}`, detail: a.conflictNote ?? '', at: a.allocatedAt, onClick: () => navigate('/app/allocations?view=conflicts')
  })),
  ...workloads.filter((w) => w.queueState === 'Delayed').map((w) => ({
    id: `d-${w.id}`, badge: 'Delayed', title: `${w.id} · ${w.name}`, detail: `Expected start ${timeAgo(w.expectedStart)}`, at: w.createdAt, onClick: () => openWorkload(w.id)
  }))].
  sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <section className="card flex flex-col" aria-labelledby="att-title">
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <h2 id="att-title" className="font-display text-xl font-semibold text-ink">Failed or delayed requests</h2>
        <p className="mt-1 text-sm text-ink-soft">{items.length} items need a decision</p>
      </div>
      {items.length === 0 ?
      <EmptyState icon={CheckCircle2Icon} title="Nothing needs attention" message="No failed workloads, delayed requests or allocation conflicts." /> :

      <ul className="divide-y divide-line">
          {items.slice(0, 6).map((i) =>
        <li key={i.id}>
              <button type="button" onClick={i.onClick} className="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-muted/60 sm:px-6">
                <StatusBadge status={i.badge} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm text-ink">{i.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-ink-soft">{i.detail}</span>
                </span>
              </button>
            </li>
        )}
        </ul>
      }
    </section>);

}