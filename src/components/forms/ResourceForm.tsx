import React, { useState } from 'react';
import { Field } from '../ui/Field';
import { availabilityOptions, environments, gpuTypes } from '../../data/options';
import type { Environment, GpuResource, ResourceAvailability, ResourceInput } from '../../types/infrastructure';

interface ResourceFormProps {
  initial?: GpuResource;
  submitLabel: string;
  onSubmit: (values: ResourceInput) => string | null | Promise<string | null>;
  onCancel: () => void;
}

type Errors = Partial<Record<'name' | 'memoryGb' | 'capacity' | 'location' | 'form', string>>;

export function ResourceForm({ initial, submitLabel, onSubmit, onCancel }: ResourceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? gpuTypes[1]);
  const [memoryGb, setMemoryGb] = useState(String(initial?.memoryGb ?? 80));
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 8));
  const [location, setLocation] = useState(initial?.location ?? '');
  const [environment, setEnvironment] = useState<Environment>(initial?.environment ?? 'Production');
  const [status, setStatus] = useState<ResourceAvailability>(initial?.status ?? 'Available');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (value: string) => {
    setType(value);
    const match = value.match(/(\d+)GB/);
    if (match) setMemoryGb(match[1]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const mem = Number(memoryGb);
    const cap = Number(capacity);
    if (!/^[a-z0-9][a-z0-9-]{2,31}$/i.test(name.trim())) next.name = 'Use 3–32 letters, numbers or hyphens (e.g. gpu-node-13).';
    if (!Number.isFinite(mem) || mem < 8 || mem > 256) next.memoryGb = 'Memory must be between 8 and 256 GB.';
    if (!Number.isInteger(cap) || cap < 1 || cap > 16) next.capacity = 'Capacity must be a whole number from 1 to 16 GPUs.';
    if (location.trim().length < 3) next.location = 'Enter the data center and rack.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const error = await onSubmit({ name: name.trim(), type, memoryGb: mem, capacity: cap, location: location.trim(), environment, status });
    setSaving(false);
    if (error) setErrors({ form: error });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{errors.form}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Resource name" htmlFor="r-name" error={errors.name}>
          <input id="r-name" className="input font-mono" value={name} onChange={(e) => setName(e.target.value)} placeholder="gpu-node-13" />
        </Field>
        <Field label="GPU type" htmlFor="r-type">
          <select id="r-type" className="input" value={type} onChange={(e) => handleTypeChange(e.target.value)}>
            {gpuTypes.map((t) =>
            <option key={t}>{t}</option>
            )}
          </select>
        </Field>
        <Field label="Memory per GPU (GB)" htmlFor="r-mem" error={errors.memoryGb}>
          <input id="r-mem" type="number" className="input" value={memoryGb} onChange={(e) => setMemoryGb(e.target.value)} />
        </Field>
        <Field label="Capacity (GPUs)" htmlFor="r-cap" error={errors.capacity}>
          <input id="r-cap" type="number" className="input" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>
        <Field label="Location" htmlFor="r-loc" error={errors.location} className="sm:col-span-2">
          <input id="r-loc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Los Angeles · Rack A5" />
        </Field>
        <Field label="Assigned environment" htmlFor="r-env">
          <select id="r-env" className="input" value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)}>
            {environments.map((env) =>
            <option key={env}>{env}</option>
            )}
          </select>
        </Field>
        <Field label="Availability" htmlFor="r-status">
          <select id="r-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as ResourceAvailability)}>
            {availabilityOptions.map((s) =>
            <option key={s}>{s}</option>
            )}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>);

}