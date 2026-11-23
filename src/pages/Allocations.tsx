import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DownloadIcon, Link2Icon, PlusIcon, SearchIcon, ShieldCheckIcon, TriangleAlertIcon, UnplugIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SegmentedTabs } from '../components/ui/SegmentedTabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { usePagination } from '../hooks/usePagination';
import type { Allocation } from '../types/infrastructure';
import { downloadCsv } from '../utils/csv';
import { durationBetween, formatDateTime } from '../utils/format';

type View = 'active' | 'released' | 'conflicts' | 'all';

export function Allocations() {
  const { allocations, workloads, resources, releaseAllocation, resolveConflict } = useData();
  const { can } = useAuth();
  const { openCreate, openWorkload } = useUI();
  const [params] = useSearchParams();
  const initial = params.get('view') as View | null;
  const [view, setView] = useState<View>(initial ?? 'active');
  const [query, setQuery] = useState('');
  const [releasing, setReleasing] = useState<Allocation | null>(null);
  const canManage = can('manage_allocations');

  const resName = (id: string) => resources.find((r) => r.id === id)?.name ?? id;
  const wlName = (id: string) => workloads.find((w) => w.id === id)?.name ?? 'Deleted workload';

  const counts = {
    active: allocations.filter((a) => !a.releasedAt).length,
    released: allocations.filter((a) => a.releasedAt).length,
    conflicts: allocations.filter((a) => a.conflict).length,
    all: allocations.length
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allocations.
    filter((a) => {
      if (view === 'active' && a.releasedAt) return false;
      if (view === 'released' && !a.releasedAt) return false;
      if (view === 'conflicts' && !a.conflict) return false;
      if (q && ![a.id, a.workloadId, resName(a.resourceId), wlName(a.workloadId)].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    }).
    sort((a, b) => new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations, view, query, resources, workloads]);

  const pager = usePagination(filtered, 10, `${view}|${query}`);

  const exportCsv = () => {
    downloadCsv('queldrin-allocations.csv', filtered.map((a) => ({
      ID: a.id, Workload: a.workloadId, Resource: resName(a.resourceId), GPUs: a.allocatedGpus, 'Allocated at': a.allocatedAt,
      'Released at': a.releasedAt ?? '', Conflict: a.conflict ? 'Yes' : 'No', Note: a.conflictNote ?? ''
    })));
    toast.success(`${filtered.length} allocation records exported`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Resource allocation records"
        title="Allocations"
        description="Workloads associated with GPU resources, allocated capacity, allocation and release timestamps, and potential conflicts flagged in stored records."
        actions={
        <>
            <button type="button" className="btn-secondary h-11" onClick={exportCsv} disabled={filtered.length === 0}>
              <DownloadIcon className="h-4 w-4" /> Export
            </button>
            {canManage &&
          <button type="button" className="btn-primary h-11" onClick={() => openCreate('allocation')}>
                <PlusIcon className="h-4 w-4" /> Record allocation
              </button>
          }
          </>
        } />
      

      {counts.conflicts > 0 && view !== 'conflicts' &&
      <button type="button" onClick={() => setView('conflicts')} className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-danger/25 bg-danger/5 px-4 py-3 text-left text-sm text-danger hover:bg-danger/10">
          <TriangleAlertIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1"><span className="font-semibold">{counts.conflicts} allocation records flagged</span> for potential capacity or memory conflicts.</span>
          <span className="font-semibold">Review</span>
        </button>
      }

      <div className="card min-w-0 max-w-full">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabs
            label="Allocation view"
            value={view}
            onChange={setView}
            options={[
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'released', label: 'Released', count: counts.released },
            { value: 'conflicts', label: 'Conflicts', count: counts.conflicts },
            { value: 'all', label: 'All', count: counts.all }]
            } />
          
          <div className="relative lg:w-80">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input className="input pl-9" placeholder="Search workload or resource" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search allocations" />
          </div>
        </div>

        {filtered.length === 0 ?
        <EmptyState icon={Link2Icon} title="No allocation records" message={view === 'conflicts' ? 'No conflicts flagged. Capacity records are consistent.' : 'Nothing matches this view.'} /> :

        <>
            <div className="table-scroll hidden xl:block" role="region" aria-label="Allocation records" tabIndex={0}>
              <table>
                <thead className="border-b border-line bg-muted/50">
                  <tr>
                    <th className="th">Allocation</th>
                    <th className="th">Workload</th>
                    <th className="th">Resource</th>
                    <th className="th">GPUs</th>
                    <th className="th">Allocated</th>
                    <th className="th">Released</th>
                    <th className="th">Held for</th>
                    <th className="th">Status</th>
                    <th className="th"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pager.pageItems.map((a) =>
                <tr key={a.id} className={`align-top ${a.conflict ? 'bg-danger/[0.03]' : ''}`}>
                      <td className="td font-mono text-xs text-ink-soft">{a.id}</td>
                      <td className="td max-w-[280px] whitespace-normal">
                        <button type="button" onClick={() => workloads.some((w) => w.id === a.workloadId) && openWorkload(a.workloadId)} className="text-left">
                          <span className="block font-mono font-semibold hover:underline">{a.workloadId}</span>
                          <span className="block text-xs text-ink-soft">{wlName(a.workloadId)}</span>
                        </button>
                        {a.conflictNote && <p className="mt-1.5 text-xs text-danger">{a.conflictNote}</p>}
                      </td>
                      <td className="td font-mono">{resName(a.resourceId)}</td>
                      <td className="td tabular-nums">{a.allocatedGpus}</td>
                      <td className="td text-ink-soft">{formatDateTime(a.allocatedAt)}</td>
                      <td className="td text-ink-soft">{a.releasedAt ? formatDateTime(a.releasedAt) : '—'}</td>
                      <td className="td tabular-nums">{durationBetween(a.allocatedAt, a.releasedAt)}</td>
                      <td className="td">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={a.releasedAt ? 'Released' : 'Active'} />
                          {a.conflict && <StatusBadge status="Conflict" />}
                        </div>
                      </td>
                      <td className="td">
                        {canManage &&
                    <div className="flex justify-end gap-1.5">
                            {a.conflict &&
                      <button type="button" className="btn-secondary btn-sm" onClick={async () => {
                        const result = await resolveConflict(a.id);
                        result.ok ? toast.success('Conflict marked resolved') : toast.error(result.error);
                      }}>
                                <ShieldCheckIcon className="h-3.5 w-3.5" /> Resolve
                              </button>
                      }
                            {!a.releasedAt &&
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setReleasing(a)}>
                                <UnplugIcon className="h-3.5 w-3.5" /> Release
                              </button>
                      }
                          </div>
                    }
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-3 p-4 xl:hidden" aria-label="Allocation records">
              {pager.pageItems.map((a) =>
                <li key={a.id} className={`rounded-xl border border-line p-4 ${a.conflict ? 'bg-danger/[0.03]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-xs text-ink-soft">{a.id}</p>
                      <p className="mt-1 break-words font-mono font-semibold">{a.workloadId}</p>
                      <p className="text-sm text-ink-soft">{wlName(a.workloadId)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={a.releasedAt ? 'Released' : 'Active'} />
                      {a.conflict && <StatusBadge status="Conflict" />}
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div className="col-span-2"><dt className="text-xs text-ink-soft">Resource</dt><dd className="break-words font-mono">{resName(a.resourceId)}</dd></div>
                    <div><dt className="text-xs text-ink-soft">GPUs</dt><dd>{a.allocatedGpus}</dd></div>
                    <div><dt className="text-xs text-ink-soft">Held for</dt><dd>{durationBetween(a.allocatedAt, a.releasedAt)}</dd></div>
                    <div><dt className="text-xs text-ink-soft">Allocated</dt><dd>{formatDateTime(a.allocatedAt)}</dd></div>
                    <div><dt className="text-xs text-ink-soft">Released</dt><dd>{a.releasedAt ? formatDateTime(a.releasedAt) : '—'}</dd></div>
                    {a.conflictNote && <div className="col-span-2 text-xs text-danger">{a.conflictNote}</div>}
                  </dl>
                  {canManage && (a.conflict || !a.releasedAt) &&
                    <div className="mt-4 flex flex-wrap gap-2">
                      {a.conflict &&
                        <button type="button" className="btn-secondary btn-sm" onClick={async () => {
                          const result = await resolveConflict(a.id);
                          result.ok ? toast.success('Conflict marked resolved') : toast.error(result.error);
                        }}>
                          <ShieldCheckIcon className="h-3.5 w-3.5" /> Resolve
                        </button>
                      }
                      {!a.releasedAt &&
                        <button type="button" className="btn-secondary btn-sm" onClick={() => setReleasing(a)}>
                          <UnplugIcon className="h-3.5 w-3.5" /> Release
                        </button>
                      }
                    </div>
                  }
                </li>
              )}
            </ul>
            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} />
          </>
        }
      </div>

      <ConfirmDialog
        open={!!releasing}
        tone="primary"
        title="Release allocation?"
        message={releasing ? `${releasing.allocatedGpus} GPU(s) on ${resName(releasing.resourceId)} will be released from ${releasing.workloadId}. The release timestamp is recorded now.` : ''}
        confirmLabel="Release capacity"
        onCancel={() => setReleasing(null)}
        onConfirm={async () => {
          if (!releasing) return;
          const result = await releaseAllocation(releasing.id);
          if (result.ok) {
            toast.success('Allocation released');
            setReleasing(null);
          } else {
            toast.error(result.error);
          }
        }} />
      
    </div>);

}