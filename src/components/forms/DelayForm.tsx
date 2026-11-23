import React, { useState } from 'react';
import { toast } from 'sonner';
import { Field } from '../ui/Field';
import { useData } from '../../contexts/DataContext';
import { delayReasons } from '../../data/options';
import type { Workload } from '../../types/infrastructure';

interface DelayFormProps {
  workload: Workload;
  onDone: () => void;
}

const hourOptions = [1, 2, 4, 6, 12, 24];

export function DelayForm({ workload, onDone }: DelayFormProps) {
  const { delayWorkload } = useData();
  const [reason, setReason] = useState(delayReasons[0]);
  const [note, setNote] = useState('');
  const [hours, setHours] = useState(4);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const full = note.trim() ? `${reason} — ${note.trim()}` : reason;
    setSaving(true);
    const res = await delayWorkload(workload.id, full, hours);
    setSaving(false);
    if (!res.ok) return setError(res.error ?? 'Could not delay workload.');
    toast.success(`${workload.id} delayed by ${hours}h`);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Reason" htmlFor="d-reason">
        <select id="d-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {delayReasons.map((r) =>
          <option key={r}>{r}</option>
          )}
        </select>
      </Field>
      <Field label="Note (optional)" htmlFor="d-note">
        <input id="d-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. waiting on job-4801 checkpoint" />
      </Field>
      <fieldset>
        <legend className="label">Move expected start by</legend>
        <div className="flex flex-wrap gap-2">
          {hourOptions.map((h) =>
          <button key={h} type="button" onClick={() => setHours(h)} aria-pressed={hours === h} className={`btn-sm btn ${hours === h ? 'bg-brand text-brand-fg' : 'border border-line bg-surface text-ink hover:bg-muted'}`}>
              +{h}h
            </button>
          )}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Record delay'}
        </button>
      </div>
    </form>);

}