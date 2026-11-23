import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SparklesIcon, TriangleAlertIcon, CheckCircle2Icon } from 'lucide-react';
import { Field } from '../ui/Field';
import { useData } from '../../contexts/DataContext';
import { detectConflict, suggestResource, usedGpus } from '../../utils/scheduling';

interface AllocationFormProps {
  defaultWorkloadId?: string;
  onDone: () => void;
}

export function AllocationForm({ defaultWorkloadId, onDone }: AllocationFormProps) {
  const { workloads, resources, allocations, allocate } = useData();
  const eligible = workloads.filter((w) => w.status !== 'Completed' && w.status !== 'Failed');
  const [workloadId, setWorkloadId] = useState(defaultWorkloadId ?? eligible[0]?.id ?? '');
  const workload = workloads.find((w) => w.id === workloadId);
  const suggested = useMemo(() => workload ? suggestResource(workload, resources, allocations) : undefined, [workload, resources, allocations]);
  const [resourceId, setResourceId] = useState(suggested?.id ?? resources[0]?.id ?? '');
  const [gpus, setGpus] = useState(String(workload?.requestedGpus ?? 1));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const resource = resources.find((r) => r.id === resourceId);
  const gpuCount = Number(gpus);
  const conflict = resource && Number.isInteger(gpuCount) && gpuCount > 0 ? detectConflict(resource, workload, gpuCount, allocations) : null;

  const handleWorkloadChange = (id: string) => {
    setWorkloadId(id);
    const w = workloads.find((x) => x.id === id);
    if (w) {
      setGpus(String(w.requestedGpus));
      const s = suggestResource(w, resources, allocations);
      if (s) setResourceId(s.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workload || !resource) return setError('Select a workload and a GPU resource.');
    if (!Number.isInteger(gpuCount) || gpuCount < 1 || gpuCount > 16) return setError('Allocated capacity must be 1–16 GPUs.');
    setSaving(true);
    const res = await allocate(workload.id, resource.id, gpuCount);
    setSaving(false);
    if (!res.ok) return setError(res.error ?? 'Could not record allocation.');
    if (res.conflict) toast.warning(`Allocation recorded and flagged: ${res.conflict}`);else
    toast.success(`${gpuCount} GPU(s) on ${resource.name} allocated to ${workload.id}`);
    onDone();
  };

  if (eligible.length === 0) {
    return <p className="text-sm text-ink-soft">There are no open workloads to allocate. Create a workload request first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Workload" htmlFor="a-wl">
        <select id="a-wl" className="input" value={workloadId} onChange={(e) => handleWorkloadChange(e.target.value)} disabled={!!defaultWorkloadId}>
          {eligible.map((w) =>
          <option key={w.id} value={w.id}>
              {w.id} · {w.name} ({w.requestedGpus}× ≥{w.minMemoryGb}GB, {w.priority})
            </option>
          )}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="GPU resource" htmlFor="a-res">
          <select id="a-res" className="input" value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            {resources.map((r) => {
              const free = Math.max(0, r.capacity - usedGpus(r.id, allocations));
              return (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.type.replace('NVIDIA ', '')} · {r.status === 'Available' ? `${free}/${r.capacity} free` : r.status}
                </option>);

            })}
          </select>
        </Field>
        <Field label="GPUs to allocate" htmlFor="a-gpus">
          <input id="a-gpus" type="number" className="input" value={gpus} onChange={(e) => setGpus(e.target.value)} />
        </Field>
      </div>

      {suggested && suggested.id !== resourceId &&
      <button type="button" onClick={() => setResourceId(suggested.id)} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-left text-sm text-ink-soft hover:bg-muted">
          <SparklesIcon className="h-4 w-4 text-accent" />
          Suggested: <span className="font-mono font-semibold text-ink">{suggested.name}</span> fits memory and capacity
        </button>
      }

      {conflict ?
      <div className="flex gap-2.5 rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger" role="status">
          <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">This record will be flagged as a potential conflict.</span> {conflict}
          </span>
        </div> :

      resource &&
      <div className="flex gap-2.5 rounded-xl bg-success/10 px-3.5 py-3 text-sm text-success" role="status">
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0" />
            No conflicts — capacity and memory requirements are met on {resource.name}.
          </div>

      }

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : conflict ? 'Record flagged allocation' : 'Record allocation'}
        </button>
      </div>
    </form>);

}