import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckIcon,
  ClockIcon,
  Link2Icon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon } from
'lucide-react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { WorkloadForm } from '../forms/WorkloadForm';
import { DelayForm } from '../forms/DelayForm';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import type { ActionResult, WorkloadStatus } from '../../types/infrastructure';
import { durationBetween, formatDateTime, formatHours, timeAgo } from '../../utils/format';

type Mode = 'view' | 'edit' | 'fail' | 'delay';

export function WorkloadDetailModal() {
  const { detailWorkloadId, closeWorkload, openCreate } = useUI();
  const { workloads, allocations, resources, decisions, activity, transitionWorkload, updateWorkload, deleteWorkload } = useData();
  const { can } = useAuth();
  const [mode, setMode] = useState<Mode>('view');
  const [failMessage, setFailMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const w = workloads.find((x) => x.id === detailWorkloadId);

  useEffect(() => {
    setMode('view');
    setFailMessage('');
  }, [detailWorkloadId]);

  const workloadAllocs = useMemo(() => allocations.filter((a) => a.workloadId === detailWorkloadId), [allocations, detailWorkloadId]);
  const timeline = useMemo(() => {
    if (!detailWorkloadId) return [];
    const fromDecisions = decisions.
    filter((d) => d.workloadId === detailWorkloadId).
    map((d) => ({ id: d.id, at: d.at, title: `Scheduling decision: ${d.decision}`, detail: `${d.reason} — ${d.decidedBy}` }));
    const fromActivity = activity.
    filter((a) => a.target.startsWith(detailWorkloadId) && a.category !== 'queue').
    map((a) => ({ id: a.id, at: a.at, title: `${a.actor} ${a.action}`, detail: a.target }));
    return [...fromDecisions, ...fromActivity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 10);
  }, [decisions, activity, detailWorkloadId]);

  if (!w) return <Modal open={false} onClose={closeWorkload} title="">{null}</Modal>;

  const hasActiveAlloc = workloadAllocs.some((a) => a.releasedAt === null);
  const canSchedule = can('schedule');
  const canManage = can('manage_workloads');

  const run = async (res: Promise<ActionResult>, success: string) => {
    const result = await res;
    if (!result.ok) toast.error(result.error ?? 'Action failed.');else
    toast.success(success);
    return result.ok;
  };
  const move = async (to: WorkloadStatus, msg: string, error?: string) => {
    if (await run(transitionWorkload(w.id, to, error), msg)) setMode('view');
  };

  const facts = [
  ['Owner', w.owner],
  ['Type', w.type],
  ['Requested GPUs', `${w.requestedGpus} × ≥${w.minMemoryGb} GB`],
  ['Estimated duration', formatHours(w.estimatedHours)],
  ['Target start', formatDateTime(w.targetStart)],
  ['Expected start', formatDateTime(w.expectedStart)],
  ['Recorded start', formatDateTime(w.recordedStart)],
  ['Completed', formatDateTime(w.completedAt)],
  ['Runtime', w.recordedStart ? durationBetween(w.recordedStart, w.completedAt) : '—'],
  ['Created', timeAgo(w.createdAt)]];


  const footer =
  mode === 'view' ?
  <>
        {canManage && w.status !== 'Running' &&
    <button type="button" className="btn-ghost mr-auto text-danger hover:bg-danger/10 hover:text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon className="h-4 w-4" /> Delete
          </button>
    }
        {canManage && (w.status === 'Pending' || w.status === 'Approved') &&
    <button type="button" className="btn-secondary" onClick={() => setMode('edit')}>
            <PencilIcon className="h-4 w-4" /> Edit
          </button>
    }
        {w.status === 'Pending' && canSchedule &&
    <>
            <button type="button" className="btn-secondary" onClick={() => setMode('delay')}><ClockIcon className="h-4 w-4" /> Delay</button>
            <button type="button" className="btn-secondary" onClick={() => {setFailMessage('Rejected during review.');setMode('fail');}}><XIcon className="h-4 w-4" /> Reject</button>
            <button type="button" className="btn-primary" onClick={() => move('Approved', `${w.id} approved`)}><CheckIcon className="h-4 w-4" /> Approve</button>
          </>
    }
        {w.status === 'Approved' && canSchedule && w.queueState !== 'Delayed' &&
    <button type="button" className="btn-secondary" onClick={() => setMode('delay')}><ClockIcon className="h-4 w-4" /> Delay</button>
    }
        {(w.status === 'Pending' || w.status === 'Approved') && !hasActiveAlloc && can('manage_allocations') &&
    <button type="button" className="btn-secondary" onClick={() => {closeWorkload();openCreate('allocation', { workloadId: w.id });}}>
            <Link2Icon className="h-4 w-4" /> Assign GPU
          </button>
    }
        {w.status === 'Approved' && (canManage || canSchedule) &&
    <button type="button" className="btn-primary" onClick={() => move('Running', `${w.id} started`)} disabled={!hasActiveAlloc} title={hasActiveAlloc ? undefined : 'Assign a GPU resource first'}>
            <PlayIcon className="h-4 w-4" /> Start execution
          </button>
    }
        {w.status === 'Running' && (canManage || canSchedule) &&
    <>
            <button type="button" className="btn-secondary" onClick={() => setMode('fail')}><TriangleAlertIcon className="h-4 w-4" /> Mark failed</button>
            <button type="button" className="btn-primary" onClick={() => move('Completed', `${w.id} completed`)}><CheckIcon className="h-4 w-4" /> Mark completed</button>
          </>
    }
        {w.status === 'Failed' && (canManage || canSchedule) &&
    <button type="button" className="btn-primary" onClick={() => move('Pending', `${w.id} returned to the queue`)}><RotateCcwIcon className="h-4 w-4" /> Retry</button>
    }
      </> :
  undefined;

  return (
    <>
      <Modal open={!!detailWorkloadId} onClose={closeWorkload} size="lg" title={w.name} description={`${w.id} · ${w.type} · requested by ${w.owner}`} footer={footer}>
        {mode === 'edit' &&
        <WorkloadForm
          initial={w}
          submitLabel="Save changes"
          onCancel={() => setMode('view')}
          onSubmit={async (values) => {
            const res = await updateWorkload(w.id, values);
            if (!res.ok) return res.error ?? 'Could not save.';
            toast.success(`${w.id} updated`);
            setMode('view');
            return null;
          }} />

        }
        {mode === 'delay' && <DelayForm workload={w} onDone={() => setMode('view')} />}
        {mode === 'fail' &&
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (failMessage.trim().length < 5) return toast.error('Describe the error (5+ characters).');
            await move('Failed', `${w.id} marked failed`, failMessage);
          }}>
          
            <label htmlFor="fail-msg" className="label">Error message</label>
            <textarea id="fail-msg" rows={3} className="input h-auto py-2.5" value={failMessage} onChange={(e) => setFailMessage(e.target.value)} placeholder="e.g. CUDA out of memory on gpu-node-03" />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setMode('view')}>Cancel</button>
              <button type="submit" className="btn-danger">Record failure</button>
            </div>
          </form>
        }
        {mode === 'view' &&
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={w.status} />
              <StatusBadge status={w.priority} />
              {w.queueState && <StatusBadge status={w.queueState} />}
            </div>
            {(w.status === 'Running' || w.progress > 0) &&
          <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-ink-soft">Execution progress</span>
                  <span className="font-semibold text-ink">{w.progress}%</span>
                </div>
                <ProgressBar value={w.progress} label="Execution progress" tone={w.status === 'Failed' ? 'danger' : w.status === 'Completed' ? 'success' : 'brand'} />
              </div>
          }
            {w.error &&
          <div className="flex gap-2.5 rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">
                <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="font-mono text-xs leading-relaxed">{w.error}</span>
              </div>
          }
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {facts.map(([k, v]) =>
            <div key={k}>
                  <dt className="text-xs text-ink-soft">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink">{v}</dd>
                </div>
            )}
            </dl>
            <div>
              <h3 className="text-xs font-semibold text-ink-soft">Requirements</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink">{w.requirements}</p>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-ink-soft">Allocations</h3>
              {workloadAllocs.length === 0 ?
            <p className="text-sm text-ink-soft">No GPU capacity allocated yet.</p> :

            <ul className="divide-y divide-line rounded-xl border border-line">
                  {workloadAllocs.map((a) =>
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                      <span className="font-mono text-ink">{resources.find((r) => r.id === a.resourceId)?.name ?? a.resourceId} · {a.allocatedGpus} GPU</span>
                      <span className="flex items-center gap-2">
                        {a.conflict && <StatusBadge status="Conflict" />}
                        <StatusBadge status={a.releasedAt ? 'Released' : 'Active'} />
                      </span>
                    </li>
              )}
                </ul>
            }
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold text-ink-soft">History</h3>
              <ol className="relative space-y-4 border-l border-line pl-5">
                {timeline.map((t) =>
              <li key={t.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                    <p className="text-sm font-medium text-ink">{t.title}</p>
                    <p className="text-xs text-ink-soft">{t.detail} · {timeAgo(t.at)}</p>
                  </li>
              )}
                {timeline.length === 0 && <li className="text-sm text-ink-soft">No history recorded yet.</li>}
              </ol>
            </div>
          </div>
        }
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${w.id}?`}
        message="The workload request will be removed and any active allocations released. Scheduling history remains in the activity log."
        confirmLabel="Delete workload"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (await run(deleteWorkload(w.id), `${w.id} deleted`)) {
            setConfirmDelete(false);
            closeWorkload();
          }
        }} />
      
    </>);

}