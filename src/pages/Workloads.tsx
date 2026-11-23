import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DownloadIcon, LayersIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SegmentedTabs } from '../components/ui/SegmentedTabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { usePagination } from '../hooks/usePagination';
import { priorities, workloadTypes } from '../data/options';
import type { WorkloadStatus } from '../types/infrastructure';
import { downloadCsv } from '../utils/csv';
import { formatDateTime, formatHours } from '../utils/format';
import { PRIORITY_RANK } from '../utils/scheduling';

type Tab = 'all' | WorkloadStatus;
type Sort = 'newest' | 'priority' | 'start';
const statuses: WorkloadStatus[] = ['Pending', 'Approved', 'Running', 'Completed', 'Failed'];

export function Workloads() {
  const { workloads } = useData();
  const { can } = useAuth();
  const { openCreate, openWorkload } = useUI();
  const [params] = useSearchParams();
  const initialStatus = params.get('status') as WorkloadStatus | null;
  const [tab, setTab] = useState<Tab>(initialStatus && statuses.includes(initialStatus) ? initialStatus : 'all');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [priority, setPriority] = useState('all');
  const [type, setType] = useState('all');
  const [owner, setOwner] = useState('all');
  const [sort, setSort] = useState<Sort>('newest');

  const ownerList = Array.from(new Set(workloads.map((w) => w.owner))).sort();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = workloads.filter((w) => {
      if (tab !== 'all' && w.status !== tab) return false;
      if (priority !== 'all' && w.priority !== priority) return false;
      if (type !== 'all' && w.type !== type) return false;
      if (owner !== 'all' && w.owner !== owner) return false;
      if (q && ![w.id, w.name, w.owner, w.requirements].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sort === 'start') return new Date(a.targetStart).getTime() - new Date(b.targetStart).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [workloads, tab, query, priority, type, owner, sort]);

  const pager = usePagination(filtered, 10, `${tab}|${query}|${priority}|${type}|${owner}|${sort}`);

  const exportCsv = () => {
    downloadCsv('queldrin-workloads.csv', filtered.map((w) => ({
      ID: w.id, Name: w.name, Owner: w.owner, Type: w.type, 'Requested GPUs': w.requestedGpus, 'Min memory GB': w.minMemoryGb,
      'Estimated hours': w.estimatedHours, Priority: w.priority, 'Target start': w.targetStart, Status: w.status, Progress: w.progress
    })));
    toast.success(`${filtered.length} workloads exported`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Workload request management"
        title="Workload requests"
        description="Create requests with owner, type and requirements, record requested GPU capacity and duration, assign priority and track every status."
        actions={
        <>
            <button type="button" className="btn-secondary h-11" onClick={exportCsv} disabled={filtered.length === 0}>
              <DownloadIcon className="h-4 w-4" /> Export
            </button>
            {can('manage_workloads') &&
          <button type="button" className="btn-primary h-11" onClick={() => openCreate('workload')}>
                <PlusIcon className="h-4 w-4" /> New workload request
              </button>
          }
          </>
        } />
      

      <div className="mb-4">
        <SegmentedTabs
          label="Filter by status"
          value={tab}
          onChange={setTab}
          options={[{ value: 'all' as Tab, label: 'All', count: workloads.length }, ...statuses.map((s) => ({ value: s as Tab, label: s, count: workloads.filter((w) => w.status === s).length }))]} />
        
      </div>

      <div className="card min-w-0 max-w-full">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input className="input pl-9" placeholder="Search ID, name, owner or requirements" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search workloads" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <select className="input lg:w-36" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
              <option value="all">All priorities</option>
              {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input lg:w-40" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
              <option value="all">All types</option>
              {workloadTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="input lg:w-40" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
              <option value="all">All owners</option>
              {ownerList.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className="input lg:w-40" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="newest">Newest first</option>
              <option value="priority">Priority</option>
              <option value="start">Target start</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ?
        <EmptyState icon={LayersIcon} title="No workloads found" message="Adjust filters or create a new workload request." /> :

        <>
            <div className="table-scroll hidden xl:block" role="region" aria-label="Workload records" tabIndex={0}>
              <table>
                <thead className="border-b border-line bg-muted/50">
                  <tr>
                    <th className="th">Workload</th>
                    <th className="th">Owner</th>
                    <th className="th">GPUs</th>
                    <th className="th">Duration</th>
                    <th className="th">Priority</th>
                    <th className="th">Target start</th>
                    <th className="th">Status</th>
                    <th className="th">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pager.pageItems.map((w) =>
                <tr key={w.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openWorkload(w.id)}>
                      <td className="td">
                        <button type="button" className="text-left" onClick={(e) => {e.stopPropagation();openWorkload(w.id);}}>
                          <span className="block font-mono font-semibold">{w.name}</span>
                          <span className="block text-xs text-ink-soft">{w.id} · {w.type}</span>
                        </button>
                      </td>
                      <td className="td">{w.owner}</td>
                      <td className="td tabular-nums">{w.requestedGpus} × {w.minMemoryGb}GB</td>
                      <td className="td tabular-nums">{formatHours(w.estimatedHours)}</td>
                      <td className="td"><StatusBadge status={w.priority} dot={false} /></td>
                      <td className="td text-ink-soft">{formatDateTime(w.targetStart)}</td>
                      <td className="td"><StatusBadge status={w.status} /></td>
                      <td className="td">
                        <div className="flex w-28 items-center gap-2">
                          <ProgressBar value={w.progress} label={`${w.id} progress`} tone={w.status === 'Failed' ? 'danger' : w.status === 'Completed' ? 'success' : 'brand'} />
                          <span className="w-9 text-right text-xs text-ink-soft tabular-nums">{w.progress}%</span>
                        </div>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-3 p-4 xl:hidden" aria-label="Workload records">
              {pager.pageItems.map((w) =>
                <li key={w.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="min-w-0 text-left" onClick={() => openWorkload(w.id)}>
                      <span className="block break-words font-mono font-semibold">{w.name}</span>
                      <span className="block text-xs text-ink-soft">{w.id} · {w.type}</span>
                    </button>
                    <StatusBadge status={w.status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div><dt className="text-xs text-ink-soft">Owner</dt><dd className="break-words">{w.owner}</dd></div>
                    <div><dt className="text-xs text-ink-soft">GPUs</dt><dd>{w.requestedGpus} × {w.minMemoryGb}GB</dd></div>
                    <div><dt className="text-xs text-ink-soft">Duration</dt><dd>{formatHours(w.estimatedHours)}</dd></div>
                    <div><dt className="text-xs text-ink-soft">Priority</dt><dd><StatusBadge status={w.priority} dot={false} /></dd></div>
                    <div className="col-span-2"><dt className="text-xs text-ink-soft">Target start</dt><dd>{formatDateTime(w.targetStart)}</dd></div>
                    <div className="col-span-2">
                      <dt className="text-xs text-ink-soft">Progress · {w.progress}%</dt>
                      <dd className="mt-1"><ProgressBar value={w.progress} label={`${w.id} progress`} tone={w.status === 'Failed' ? 'danger' : w.status === 'Completed' ? 'success' : 'brand'} /></dd>
                    </div>
                  </dl>
                </li>
              )}
            </ul>
            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} />
          </>
        }
      </div>
    </div>);

}