import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CpuIcon, LayoutGridIcon, PencilIcon, PlusIcon, SearchIcon, TableIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ResourceForm } from '../components/forms/ResourceForm';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { environments } from '../data/options';
import type { GpuResource } from '../types/infrastructure';
import { effectiveStatus, fleetSummary, usedGpus } from '../utils/scheduling';

type StatusFilter = 'all' | 'Available' | 'allocated' | 'Maintenance' | 'Offline' | 'unavailable';

export function Resources() {
  const { resources, allocations, updateResource, deleteResource } = useData();
  const { can } = useAuth();
  const { openCreate } = useUI();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<StatusFilter>(params.get('status') as StatusFilter ?? 'all');
  const [env, setEnv] = useState(params.get('env') ?? 'all');
  const [type, setType] = useState('all');
  const [view, setView] = useState<'table' | 'grid'>(() => typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table');
  const [editing, setEditing] = useState<GpuResource | null>(null);
  const [deleting, setDeleting] = useState<GpuResource | null>(null);
  const canEdit = can('manage_resources');
  const fleet = fleetSummary(resources, allocations);

  const types = Array.from(new Set(resources.map((r) => r.type)));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      const eff = effectiveStatus(r, allocations);
      if (q && ![r.name, r.type, r.location].some((v) => v.toLowerCase().includes(q))) return false;
      if (env !== 'all' && r.environment !== env) return false;
      if (type !== 'all' && r.type !== type) return false;
      if (status === 'Available' && eff !== 'Available') return false;
      if (status === 'allocated' && eff !== 'Partially allocated' && eff !== 'Fully allocated') return false;
      if (status === 'Maintenance' && eff !== 'Maintenance') return false;
      if (status === 'Offline' && eff !== 'Offline') return false;
      if (status === 'unavailable' && eff !== 'Maintenance' && eff !== 'Offline') return false;
      return true;
    });
  }, [resources, allocations, query, env, type, status]);

  const hasFilters = query || status !== 'all' || env !== 'all' || type !== 'all';
  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setEnv('all');
    setType('all');
  };

  const actions = (r: GpuResource) =>
  canEdit &&
  <div className="flex justify-end gap-1.5">
        <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}>
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="icon-btn h-8 w-8 hover:text-danger" onClick={() => setDeleting(r)} aria-label={`Remove ${r.name}`}>
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </div>;


  const capacityCell = (r: GpuResource) => {
    const used = usedGpus(r.id, allocations);
    return (
      <div className="w-32">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="font-semibold text-ink tabular-nums">{used}/{r.capacity} GPUs</span>
          {used > r.capacity && <span className="font-semibold text-danger">over</span>}
        </div>
        <ProgressBar value={used} max={r.capacity} tone={used > r.capacity ? 'danger' : 'brand'} label={`${r.name} allocation`} />
      </div>);

  };

  const renderResourceCards = (className: string) => (
    <ul className={className}>
      {filtered.map((r) =>
        <li key={r.id} className="flex min-w-0 flex-col rounded-xl border border-line p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words font-mono font-semibold text-ink">{r.name}</p>
              <p className="break-words text-xs text-ink-soft">{r.type}</p>
            </div>
            <StatusBadge status={effectiveStatus(r, allocations)} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-ink-soft">Memory</dt><dd className="font-medium text-ink">{r.memoryGb} GB</dd></div>
            <div><dt className="text-xs text-ink-soft">Environment</dt><dd className="font-medium text-ink">{r.environment}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-ink-soft">Location</dt><dd className="break-words font-medium text-ink">{r.location}</dd></div>
          </dl>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
            {capacityCell(r)}
            {actions(r)}
          </div>
        </li>
      )}
    </ul>
  );

  return (
    <div>
      <PageHeader
        eyebrow="GPU resource registry"
        title="GPU resources"
        description="Register compute nodes with their type, memory and capacity, record location and environment, and track availability."
        actions={
        canEdit &&
        <button type="button" className="btn-primary h-11" onClick={() => openCreate('resource')}>
              <PlusIcon className="h-4 w-4" /> Register GPU resource
            </button>

        } />
      

      <dl className="card mb-5 grid grid-cols-2 divide-line sm:grid-cols-5 sm:divide-x">
        {[
        ['Registered nodes', resources.length],
        ['Total GPUs', fleet.total],
        ['Allocated', fleet.allocated],
        ['Available', fleet.available],
        ['Unavailable', fleet.unavailable]].
        map(([k, v]) =>
        <div key={k} className="px-5 py-4">
            <dt className="text-xs text-ink-soft">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{v}</dd>
          </div>
        )}
      </dl>

      <div className="card min-w-0 max-w-full">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input className="input pl-9" placeholder="Search by name, type or location" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search resources" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select className="input sm:w-44" value={type} onChange={(e) => setType(e.target.value)} aria-label="GPU type">
              <option value="all">All GPU types</option>
              {types.map((t) => <option key={t} value={t}>{t.replace('NVIDIA ', '')}</option>)}
            </select>
            <select className="input sm:w-40" value={env} onChange={(e) => setEnv(e.target.value)} aria-label="Environment">
              <option value="all">All environments</option>
              {environments.map((e) => <option key={e}>{e}</option>)}
            </select>
            <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label="Status">
              <option value="all">All statuses</option>
              <option value="Available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Offline">Offline</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <div className="flex rounded-xl border border-line p-0.5" role="group" aria-label="View">
              <button type="button" onClick={() => setView('table')} aria-pressed={view === 'table'} aria-label="Table view" className={`flex h-9 flex-1 items-center justify-center rounded-lg px-2.5 ${view === 'table' ? 'bg-accent-soft text-accent' : 'text-ink-soft'}`}>
                <TableIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view" className={`flex h-9 flex-1 items-center justify-center rounded-lg px-2.5 ${view === 'grid' ? 'bg-accent-soft text-accent' : 'text-ink-soft'}`}>
                <LayoutGridIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ?
        <EmptyState icon={CpuIcon} title="No resources match" message="Try a different search or clear the filters." action={hasFilters ? <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button> : undefined} /> :
        view === 'table' ?
        <>
          <div className="table-scroll hidden xl:block" role="region" aria-label="GPU resource records" tabIndex={0}>
            <table>
              <thead className="border-b border-line bg-muted/50">
                <tr>
                  <th className="th">Resource</th>
                  <th className="th">Memory</th>
                  <th className="th">Allocation</th>
                  <th className="th">Location</th>
                  <th className="th">Environment</th>
                  <th className="th">Status</th>
                  <th className="th"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((r) =>
              <tr key={r.id} className="hover:bg-muted/40">
                    <td className="td">
                      <p className="font-mono font-semibold">{r.name}</p>
                      <p className="text-xs text-ink-soft">{r.type}</p>
                    </td>
                    <td className="td tabular-nums">{r.memoryGb} GB</td>
                    <td className="td">{capacityCell(r)}</td>
                    <td className="td text-ink-soft">{r.location}</td>
                    <td className="td">{r.environment}</td>
                    <td className="td"><StatusBadge status={effectiveStatus(r, allocations)} /></td>
                    <td className="td">{actions(r)}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
          {renderResourceCards('grid gap-4 p-4 sm:grid-cols-2 xl:hidden')}
        </> :
        renderResourceCards('grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3')
        }
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? ''}`} description="Update resource details or availability status.">
        {editing &&
        <ResourceForm
          initial={editing}
          submitLabel="Save changes"
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            const res = await updateResource(editing.id, values);
            if (!res.ok) return res.error ?? 'Could not save.';
            toast.success(`${values.name} updated`);
            setEditing(null);
            return null;
          }} />

        }
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title={`Remove ${deleting?.name ?? ''}?`}
        message="The node will be removed from the registry. Resources with active allocations cannot be removed until those allocations are released."
        confirmLabel="Remove resource"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteResource(deleting.id);
          if (res.ok) {
            toast.success(`${deleting.name} removed`);
            setDeleting(null);
          } else {
            toast.error(res.error);
          }
        }} />
      
    </div>);

}