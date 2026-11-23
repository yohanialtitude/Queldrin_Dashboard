import type { ActivityEntry, DataState } from '../types/infrastructure';
import { nowIso, uid } from './format';

const SIM_ACTOR = 'Scheduler (simulated)';

export function tickSimulation(state: DataState): DataState {
  const now = nowIso();
  const finished: string[] = [];
  const entries: ActivityEntry[] = [];

  const workloads = state.workloads.map((w) => {
    if (w.status !== 'Running') return w;
    const step = 1 + Math.floor(Math.random() * 3);
    const progress = Math.min(100, w.progress + step);
    if (progress >= 100) {
      finished.push(w.id);
      entries.push({
        id: uid('act'),
        actor: SIM_ACTOR,
        action: 'completed workload',
        target: `${w.id} · ${w.name}`,
        category: 'execution',
        at: now
      });
      return { ...w, progress: 100, status: 'Completed' as const, completedAt: now, queueState: null };
    }
    return { ...w, progress };
  });

  if (finished.length === 0 && workloads.every((w, i) => w === state.workloads[i])) return state;

  const allocations = finished.length ?
  state.allocations.map((a) =>
  finished.includes(a.workloadId) && a.releasedAt === null ? { ...a, releasedAt: now } : a
  ) :
  state.allocations;

  return {
    ...state,
    workloads,
    allocations,
    activity: [...entries, ...state.activity].slice(0, 300)
  };
}