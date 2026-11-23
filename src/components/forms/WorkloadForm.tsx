import React, { useState } from 'react';
import { Field } from '../ui/Field';
import { useAuth } from '../../contexts/AuthContext';
import { owners, priorities, workloadTypes } from '../../data/options';
import type { Priority, Workload, WorkloadInput, WorkloadType } from '../../types/infrastructure';
import { hoursFromNow, toDateTimeLocal } from '../../utils/format';

interface WorkloadFormProps {
  initial?: Workload;
  submitLabel: string;
  onSubmit: (values: WorkloadInput) => string | null | Promise<string | null>;
  onCancel: () => void;
}

type Errors = Partial<Record<'name' | 'owner' | 'requirements' | 'requestedGpus' | 'minMemoryGb' | 'estimatedHours' | 'targetStart' | 'form', string>>;

export function WorkloadForm({ initial, submitLabel, onSubmit, onCancel }: WorkloadFormProps) {
  const { user } = useAuth();
  const ownerOptions = user && !owners.includes(user.name) ? [user.name, ...owners] : owners;
  const [name, setName] = useState(initial?.name ?? '');
  const [owner, setOwner] = useState(initial?.owner ?? user?.name ?? owners[0]);
  const [type, setType] = useState<WorkloadType>(initial?.type ?? 'Training');
  const [requirements, setRequirements] = useState(initial?.requirements ?? '');
  const [requestedGpus, setRequestedGpus] = useState(String(initial?.requestedGpus ?? 4));
  const [minMemoryGb, setMinMemoryGb] = useState(String(initial?.minMemoryGb ?? 80));
  const [estimatedHours, setEstimatedHours] = useState(String(initial?.estimatedHours ?? 8));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'Medium');
  const [targetStart, setTargetStart] = useState(toDateTimeLocal(initial?.targetStart ?? hoursFromNow(2)));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const gpus = Number(requestedGpus);
    const mem = Number(minMemoryGb);
    const hrs = Number(estimatedHours);
    const start = new Date(targetStart);
    if (name.trim().length < 3) next.name = 'Name must be at least 3 characters.';
    if (!owner.trim()) next.owner = 'Select an owner.';
    if (requirements.trim().length < 10) next.requirements = 'Describe framework, memory and constraints (10+ characters).';
    if (!Number.isInteger(gpus) || gpus < 1 || gpus > 16) next.requestedGpus = 'Request 1–16 GPUs.';
    if (!Number.isFinite(mem) || mem < 8 || mem > 256) next.minMemoryGb = 'Enter 8–256 GB.';
    if (!Number.isFinite(hrs) || hrs < 0.25 || hrs > 720) next.estimatedHours = 'Enter between 0.25 and 720 hours.';
    if (Number.isNaN(start.getTime())) next.targetStart = 'Choose a valid start time.';else
    if (!initial && start.getTime() < Date.now() - 5 * 60000) next.targetStart = 'Target start cannot be in the past.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const error = await onSubmit({
      name: name.trim(),
      owner,
      type,
      requirements: requirements.trim(),
      requestedGpus: gpus,
      minMemoryGb: mem,
      estimatedHours: hrs,
      priority,
      targetStart: start.toISOString()
    });
    setSaving(false);
    if (error) setErrors({ form: error });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{errors.form}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Workload name" htmlFor="w-name" error={errors.name}>
          <input id="w-name" className="input font-mono" value={name} onChange={(e) => setName(e.target.value)} placeholder="llm-eval-nightly" />
        </Field>
        <Field label="Owner" htmlFor="w-owner" error={errors.owner}>
          <select id="w-owner" className="input" value={owner} onChange={(e) => setOwner(e.target.value)}>
            {ownerOptions.map((o) =>
            <option key={o}>{o}</option>
            )}
          </select>
        </Field>
        <Field label="Workload type" htmlFor="w-type">
          <select id="w-type" className="input" value={type} onChange={(e) => setType(e.target.value as WorkloadType)}>
            {workloadTypes.map((t) =>
            <option key={t}>{t}</option>
            )}
          </select>
        </Field>
        <Field label="Priority" htmlFor="w-priority">
          <select id="w-priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {priorities.map((p) =>
            <option key={p}>{p}</option>
            )}
          </select>
        </Field>
        <Field label="Requirements" htmlFor="w-req" error={errors.requirements} className="sm:col-span-2">
          <textarea id="w-req" rows={3} className="input h-auto py-2.5" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="PyTorch 2.4, NCCL, NVLink preferred…" />
        </Field>
        <Field label="Requested GPUs" htmlFor="w-gpus" error={errors.requestedGpus}>
          <input id="w-gpus" type="number" className="input" value={requestedGpus} onChange={(e) => setRequestedGpus(e.target.value)} />
        </Field>
        <Field label="Min. memory per GPU (GB)" htmlFor="w-mem" error={errors.minMemoryGb}>
          <input id="w-mem" type="number" className="input" value={minMemoryGb} onChange={(e) => setMinMemoryGb(e.target.value)} />
        </Field>
        <Field label="Estimated duration (hours)" htmlFor="w-hrs" error={errors.estimatedHours}>
          <input id="w-hrs" type="number" step="0.25" className="input" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
        </Field>
        <Field label="Target start" htmlFor="w-start" error={errors.targetStart}>
          <input id="w-start" type="datetime-local" className="input" value={targetStart} onChange={(e) => setTargetStart(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>);

}