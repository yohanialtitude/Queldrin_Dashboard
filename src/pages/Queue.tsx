import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckIcon, ClockIcon, Link2Icon, ListOrderedIcon, PlayIcon, RotateCcwIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SegmentedTabs } from '../components/ui/SegmentedTabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { DelayForm } from '../components/forms/DelayForm';
import { RecentDecisions } from '../components/dashboard/RecentDecisions';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import type { ActionResult, QueueState, Workload } from '../types/infrastructure';
import { formatDateTime, timeAgo } from '../utils/format';
import { fleetSummary, sortByPriority } from '../utils/scheduling';

type View = 'all' | QueueState;
const views: QueueState[] = ['Queued', 'Assigned', 'Delayed'];

export function Queue() {
  const { workloads, allocations, resources, transitionWorkload, requeueWorkload } = useData();
  const { can } = useAuth();
  const { openCreate, openWorkload } = useUI();
  const [params] = useSearchParams();
  const initial = params.get('view') as QueueState | null;
  const [view, setView] = useState<View>(initial && views.includes(initial) ? initial : 'all');
  const [delaying, setDelaying] = useState<Workload | null>(null);
  const fleet = fleetSummary(resources, allocations);

  const queue = useMemo(() => sortByPriority(workloads.filter((w) => w.queueState !== null)), [workloads]);
  const shown = view === 'all' ? queue : queue.filter((w) => w.queueState === view);
  const canSchedule = can('schedule');
  const canAllocate = can('manage_allocations');

  const run = async (res: Promise<ActionResult>, msg: string) => {
    const result = await res;
    return result.ok ? toast.success(msg) : toast.error(result.error);
  };
  const hasAlloc = (id: string) => allocations.some((a) => a.workloadId === id && a.releasedAt === null);

  return (
    <div>
      <PageHeader
        eyebrow="Scheduling & queue management"
        title="Scheduling queue"
        description="Workload requests ordered by priority and target start. Record approvals, assignments and delays, and compare expected against recorded start times." />
      

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="card min-w-0" aria-labelledby="queue-title">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="queue-title" className="font-display text-xl font-semibold text-ink">
              {shown.length} {view === 'all' ? 'workloads in queue' : `${view.toLowerCase()} workloads`}
            </h2>
            <SegmentedTabs
              label="Queue state"
              value={view}
              onChange={setView}
              options={[{ value: 'all' as View, label: 'All', count: queue.length }, ...views.map((v) => ({ value: v as View, label: v, count: queue.filter((w) => w.queueState === v).length }))]} />
            
          </div>
          {shown.length === 0 ?
          <EmptyState icon={ListOrderedIcon} title="Queue is clear" message="No workloads in this state. New requests appear here as Pending." /> :

          <ol className="divide-y divide-line">
              {shown.map((w) => {
              const position = queue.indexOf(w) + 1;
              const late = w.expectedStart && new Date(w.expectedStart).getTime() > new Date(w.targetStart).getTime() + 5 * 60000;
              return (
                <li key={w.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-semibold text-ink" aria-label={`Queue position ${position}`}>
                        {position}
                      </span>
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => openWorkload(w.id)} className="block max-w-full truncate text-left font-mono text-[15px] font-semibold text-ink hover:underline">
                          {w.name}
                        </button>
                        <p className="text-xs text-ink-soft">{w.id} · {w.owner} · {w.requestedGpus}× ≥{w.minMemoryGb}GB</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={w.priority} dot={false} />
                          <StatusBadge status={w.queueState ?? 'Queued'} />
                          <StatusBadge status={w.status} />
                        </div>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:w-72 lg:w-64">
                      <dt className="text-ink-soft">Target start</dt>
                      <dd className="text-right text-ink tabular-nums">{formatDateTime(w.targetStart)}</dd>
                      <dt className="text-ink-soft">Expected start</dt>
                      <dd className={`text-right tabular-nums ${late ? 'font-semibold text-warning' : 'text-ink'}`}>{formatDateTime(w.expectedStart)}</dd>
                      <dt className="text-ink-soft">Recorded start</dt>
                      <dd className="text-right text-ink-soft">{w.recordedStart ? formatDateTime(w.recordedStart) : 'Not started'}</dd>
                    </dl>
                    <div className="flex flex-wrap gap-1.5 lg:w-[220px] lg:justify-end">
                      {canSchedule && w.status === 'Pending' &&
                    <button type="button" className="btn-secondary btn-sm" onClick={() => { void run(transitionWorkload(w.id, 'Approved'), `${w.id} approved`); }}>
                          <CheckIcon className="h-3.5 w-3.5" /> Approve
                        </button>
                    }
                      {canAllocate && !hasAlloc(w.id) &&
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openCreate('allocation', { workloadId: w.id })}>
                          <Link2Icon className="h-3.5 w-3.5" /> Assign
                        </button>
                    }
                      {canSchedule && w.status === 'Approved' && hasAlloc(w.id) &&
                    <button type="button" className="btn-primary btn-sm" onClick={() => { void run(transitionWorkload(w.id, 'Running'), `${w.id} started`); }}>
                          <PlayIcon className="h-3.5 w-3.5" /> Start
                        </button>
                    }
                      {canSchedule && w.queueState !== 'Delayed' &&
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setDelaying(w)}>
                          <ClockIcon className="h-3.5 w-3.5" /> Delay
                        </button>
                    }
                      {canSchedule && w.queueState === 'Delayed' &&
                    <button type="button" className="btn-ghost btn-sm" onClick={() => { void run(requeueWorkload(w.id), `${w.id} requeued`); }}>
                          <RotateCcwIcon className="h-3.5 w-3.5" /> Requeue
                        </button>
                    }
                      {!canSchedule && !canAllocate && <span className="text-xs text-ink-soft">Added {timeAgo(w.createdAt)}</span>}
                    </div>
                  </li>);

            })}
            </ol>
          }
        </section>

        <div className="space-y-5">
          <section className="card p-5 sm:p-6" aria-labelledby="free-title">
            <h2 id="free-title" className="font-display text-xl font-semibold text-ink">Free capacity now</h2>
            <p className="mt-1 text-sm text-ink-soft">GPUs available for new assignments</p>
            <p className="mt-4 text-4xl font-semibold text-ink tabular-nums">
              {fleet.available}
              <span className="ml-1 text-base font-medium text-ink-soft">/ {fleet.total} GPUs</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {resources.
              filter((r) => r.status === 'Available').
              map((r) => ({ r, free: r.capacity - allocations.filter((a) => a.resourceId === r.id && a.releasedAt === null).reduce((s, a) => s + a.allocatedGpus, 0) })).
              filter((x) => x.free > 0).
              slice(0, 5).
              map(({ r, free }) =>
              <li key={r.id} className="flex justify-between gap-2">
                    <span className="truncate font-mono text-ink">{r.name}</span>
                    <span className="whitespace-nowrap text-ink-soft">{free} free · {r.memoryGb}GB</span>
                  </li>
              )}
            </ul>
          </section>
          <RecentDecisions limit={5} />
        </div>
      </div>

      <Modal open={!!delaying} onClose={() => setDelaying(null)} title={`Delay ${delaying?.id ?? ''}`} description="Record why the workload is delayed and move its expected start time.">
        {delaying && <DelayForm workload={delaying} onDone={() => setDelaying(null)} />}
      </Modal>
    </div>);

}