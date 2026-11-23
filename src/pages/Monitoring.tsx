import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActivityIcon, CheckIcon, PauseIcon, PlayIcon, SearchIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { usePagination } from '../hooks/usePagination';
import { durationBetween, formatDateTime, formatHours, timeAgo } from '../utils/format';

export function Monitoring() {
  const { workloads, allocations, resources, simulationOn, setSimulationOn, lastTick, transitionWorkload } = useData();
  const { can } = useAuth();
  const { openWorkload } = useUI();
  const [status, setStatus] = useState('all');
  const [owner, setOwner] = useState('all');
  const [query, setQuery] = useState('');
  const canAct = can('manage_workloads') || can('schedule');

  const running = workloads.filter((w) => w.status === 'Running');
  const executed = workloads.filter((w) => w.recordedStart);
  const completed = executed.filter((w) => w.status === 'Completed');
  const failed = executed.filter((w) => w.status === 'Failed');
  const successRate = completed.length + failed.length ? Math.round(completed.length / (completed.length + failed.length) * 100) : 0;
  const ownerList = Array.from(new Set(executed.map((w) => w.owner))).sort();

  const history = useMemo(() => {
    const q = query.trim().toLowerCase();
    return executed.
    filter((w) => (status === 'all' || w.status === status) && (owner === 'all' || w.owner === owner)).
    filter((w) => !q || [w.id, w.name, w.error ?? ''].some((v) => v.toLowerCase().includes(q))).
    sort((a, b) => new Date(b.recordedStart ?? 0).getTime() - new Date(a.recordedStart ?? 0).getTime());
  }, [executed, status, owner, query]);
  const pager = usePagination(history, 8, `${status}|${owner}|${query}`);

  const nodesFor = (id: string) =>
  allocations.
  filter((a) => a.workloadId === id && !a.releasedAt).
  map((a) => resources.find((r) => r.id === a.resourceId)?.name ?? a.resourceId).
  join(', ') || '—';

  return (
    <div>
      <PageHeader
        eyebrow="Workload execution monitoring"
        title="Execution monitoring"
        description="Execution status and progress for running workloads, with start and completion times, captured errors and full execution history."
        actions={
        <button type="button" className="btn-secondary h-11" onClick={() => {setSimulationOn(!simulationOn);toast.success(simulationOn ? 'Simulated updates paused' : 'Simulated updates resumed');}}>
            {simulationOn ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            {simulationOn ? 'Pause simulated updates' : 'Resume simulated updates'}
          </button>
        } />
      

      <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
        <span className="flex items-center gap-2 text-ink-soft">
          <span className={`h-2 w-2 rounded-full ${simulationOn ? 'bg-success' : 'bg-ink-soft'}`} aria-hidden="true" />
          {simulationOn ? `Live simulation · last update ${lastTick ? timeAgo(lastTick) : 'pending'}` : 'Simulation paused'}
        </span>
        <span className="text-ink-soft"><span className="font-semibold text-ink">{running.length}</span> running</span>
        <span className="text-ink-soft"><span className="font-semibold text-ink">{completed.length}</span> completed</span>
        <span className="text-ink-soft"><span className="font-semibold text-ink">{failed.length}</span> failed</span>
        <span className="text-ink-soft"><span className="font-semibold text-ink">{successRate}%</span> success rate</span>
      </div>

      <section aria-labelledby="running-title" className="mb-8">
        <h2 id="running-title" className="mb-3 font-display text-xl font-semibold text-ink">Running now</h2>
        {running.length === 0 ?
        <div className="card"><EmptyState icon={ActivityIcon} title="No workloads running" message="Approved workloads with an allocation can be started from the queue." /></div> :

        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {running.map((w) => {
            const elapsed = w.recordedStart ? (Date.now() - new Date(w.recordedStart).getTime()) / 3600000 : 0;
            return (
              <li key={w.id} className="card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button type="button" onClick={() => openWorkload(w.id)} className="block max-w-full truncate text-left font-mono font-semibold text-ink hover:underline">{w.name}</button>
                      <p className="text-xs text-ink-soft">{w.id} · {w.owner}</p>
                    </div>
                    <StatusBadge status={w.priority} dot={false} />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between">
                    <span className="text-3xl font-semibold text-ink tabular-nums">{w.progress}%</span>
                    <span className="text-xs text-ink-soft">{formatHours(elapsed)} of ~{formatHours(w.estimatedHours)}</span>
                  </div>
                  <div className="mt-2"><ProgressBar value={w.progress} label={`${w.id} progress`} /></div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <dt className="text-ink-soft">Started</dt>
                    <dd className="text-right text-ink">{formatDateTime(w.recordedStart)}</dd>
                    <dt className="text-ink-soft">Nodes</dt>
                    <dd className="truncate text-right font-mono text-ink">{nodesFor(w.id)}</dd>
                  </dl>
                  {canAct &&
                <div className="mt-auto flex gap-2 pt-4">
                      <button type="button" className="btn-secondary btn-sm flex-1" onClick={() => openWorkload(w.id)}>Details</button>
                      <button type="button" className="btn-primary btn-sm flex-1" onClick={async () => {
                        const result = await transitionWorkload(w.id, 'Completed');
                        result.ok ? toast.success(`${w.id} completed`) : toast.error(result.error);
                      }}>
                        <CheckIcon className="h-3.5 w-3.5" /> Complete
                      </button>
                    </div>
                }
                </li>);

          })}
          </ul>
        }
      </section>

      <section className="card min-w-0 max-w-full" aria-labelledby="history-title">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <h2 id="history-title" className="flex-1 font-display text-xl font-semibold text-ink">Execution history</h2>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="relative col-span-2 sm:w-64">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input className="input pl-9" placeholder="Search ID, name or error" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search history" />
            </div>
            <select className="input sm:w-36" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="all">All statuses</option>
              <option>Running</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
            <select className="input sm:w-40" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
              <option value="all">All owners</option>
              {ownerList.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {history.length === 0 ?
        <EmptyState icon={ActivityIcon} title="No executions match" message="Change the status or owner filter." /> :

        <>
            <div className="table-scroll hidden xl:block" role="region" aria-label="Execution history" tabIndex={0}>
              <table>
                <thead className="border-b border-line bg-muted/50">
                  <tr>
                    <th className="th">Workload</th>
                    <th className="th">Owner</th>
                    <th className="th">Started</th>
                    <th className="th">Completed</th>
                    <th className="th">Runtime</th>
                    <th className="th">Status</th>
                    <th className="th">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pager.pageItems.map((w) =>
                <tr key={w.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openWorkload(w.id)}>
                      <td className="td"><span className="block font-mono font-semibold">{w.name}</span><span className="block text-xs text-ink-soft">{w.id}</span></td>
                      <td className="td">{w.owner}</td>
                      <td className="td text-ink-soft">{formatDateTime(w.recordedStart)}</td>
                      <td className="td text-ink-soft">{formatDateTime(w.completedAt)}</td>
                      <td className="td tabular-nums">{durationBetween(w.recordedStart, w.completedAt)}</td>
                      <td className="td"><StatusBadge status={w.status} /></td>
                      <td className="td max-w-[280px] truncate font-mono text-xs text-danger" title={w.error ?? undefined}>{w.error ?? <span className="text-ink-soft">—</span>}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-3 p-4 xl:hidden" aria-label="Execution history">
              {pager.pageItems.map((w) =>
                <li key={w.id}>
                  <button type="button" className="w-full rounded-xl border border-line p-4 text-left hover:bg-muted/40" onClick={() => openWorkload(w.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-mono font-semibold">{w.name}</p>
                        <p className="text-xs text-ink-soft">{w.id}</p>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                      <div><dt className="text-xs text-ink-soft">Owner</dt><dd className="break-words">{w.owner}</dd></div>
                      <div><dt className="text-xs text-ink-soft">Runtime</dt><dd>{durationBetween(w.recordedStart, w.completedAt)}</dd></div>
                      <div><dt className="text-xs text-ink-soft">Started</dt><dd>{formatDateTime(w.recordedStart)}</dd></div>
                      <div><dt className="text-xs text-ink-soft">Completed</dt><dd>{formatDateTime(w.completedAt)}</dd></div>
                      <div className="col-span-2"><dt className="text-xs text-ink-soft">Error</dt><dd className="break-words font-mono text-xs text-danger">{w.error ?? '—'}</dd></div>
                    </dl>
                  </button>
                </li>
              )}
            </ul>
            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} />
          </>
        }
      </section>
    </div>);

}