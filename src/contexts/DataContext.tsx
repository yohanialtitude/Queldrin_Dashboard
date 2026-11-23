import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import {
  seedActivity,
  seedAllocations,
  seedDecisions,
  seedResources,
  seedWorkloads
} from '../data/seed';
import type {
  ActionResult,
  ActivityCategory,
  ActivityEntry,
  DataState,
  DecisionType,
  ResourceInput,
  SchedulingDecision,
  Workload,
  WorkloadInput,
  WorkloadStatus
} from '../types/infrastructure';
import { formatFirestoreError, initializeWorkspace, persistWorkspaceChanges } from '../data/firestoreWorkspace';
import { db } from '../firebase';
import { hoursFromNow, nowIso, uid } from '../utils/format';
import { ALLOWED_TRANSITIONS, detectConflict, nextWorkloadId, usedGpus } from '../utils/scheduling';
import { tickSimulation } from '../utils/simulation';

type WorkspaceCollection = keyof DataState;

const collectionNames: Record<WorkspaceCollection, string> = {
  resources: 'resources',
  workloads: 'workloads',
  allocations: 'allocations',
  decisions: 'decisions',
  activity: 'activity'
};

interface DataContextValue extends DataState {
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  simulationOn: boolean;
  setSimulationOn: (on: boolean) => void;
  lastTick: string | null;
  addResource: (input: ResourceInput) => Promise<ActionResult>;
  updateResource: (id: string, input: Partial<ResourceInput>) => Promise<ActionResult>;
  deleteResource: (id: string) => Promise<ActionResult>;
  addWorkload: (input: WorkloadInput) => Promise<ActionResult>;
  updateWorkload: (id: string, input: Partial<WorkloadInput>) => Promise<ActionResult>;
  deleteWorkload: (id: string) => Promise<ActionResult>;
  transitionWorkload: (id: string, to: WorkloadStatus, error?: string) => Promise<ActionResult>;
  allocate: (workloadId: string, resourceId: string, gpus: number) => Promise<ActionResult>;
  delayWorkload: (id: string, reason: string, hours: number) => Promise<ActionResult>;
  requeueWorkload: (id: string) => Promise<ActionResult>;
  releaseAllocation: (id: string) => Promise<ActionResult>;
  resolveConflict: (id: string) => Promise<ActionResult>;
  resetData: () => Promise<ActionResult>;
}

const DataContext = createContext<DataContextValue | null>(null);

function initialState(): DataState {
  return {
    resources: seedResources,
    workloads: seedWorkloads,
    allocations: seedAllocations,
    decisions: seedDecisions,
    activity: seedActivity
  };
}

const fail = (error: string): ActionResult => ({ ok: false, error });

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const actor = user?.name ?? 'System';
  const [state, setState] = useState<DataState>(initialState);
  const stateRef = useRef(state);
  const loadedRef = useRef(false);
  const simulationWriteRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [simulationOn, setSimulationOn] = useState(true);
  const [lastTick, setLastTick] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initializedCollections = new Set<WorkspaceCollection>();
    const subscriptions: Unsubscribe[] = [];
    const userId = user?.id;

    const demoState = initialState();
    stateRef.current = demoState;
    loadedRef.current = false;
    setState(demoState);
    setError(null);
    setLoading(!!userId);

    if (!userId) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    const startSubscriptions = async () => {
      try {
        await initializeWorkspace(userId, initialState());
        if (cancelled) return;

        for (const key of Object.keys(collectionNames) as WorkspaceCollection[]) {
          const collectionRef = collection(db, 'users', userId, collectionNames[key]);
          subscriptions.push(onSnapshot(collectionRef, (snapshot) => {
            const items = snapshot.docs.map((item) => item.data()) as DataState[typeof key];
            const nextState = { ...stateRef.current, [key]: items } as DataState;
            stateRef.current = nextState;
            setState(nextState);

            initializedCollections.add(key);
            if (initializedCollections.size === Object.keys(collectionNames).length) {
              loadedRef.current = true;
              setLoading(false);
            }
          }, (snapshotError) => {
            if (cancelled) return;
            setError(formatFirestoreError(snapshotError));
            setLoading(false);
          }));
        }
      } catch (workspaceError) {
        if (cancelled) return;
        setError(formatFirestoreError(workspaceError));
        setLoading(false);
      }
    };

    void startSubscriptions();
    return () => {
      cancelled = true;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [user?.id, retryCount]);

  useEffect(() => {
    const userId = user?.id;
    if (!simulationOn || !userId || !loadedRef.current) return;
    const timer = window.setInterval(async () => {
      if (simulationWriteRef.current) return;
      const current = stateRef.current;
      const next = tickSimulation(current);
      if (next === current) return;
      simulationWriteRef.current = true;
      stateRef.current = next;
      setState(next);
      setLastTick(nowIso());
      try {
        await persistWorkspaceChanges(userId, current, next);
      } catch (writeError) {
        if (stateRef.current === next) {
          stateRef.current = current;
          setState(current);
        }
        setError(formatFirestoreError(writeError));
      } finally {
        simulationWriteRef.current = false;
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [simulationOn, user?.id, loading]);

  const entry = (action: string, target: string, category: ActivityCategory): ActivityEntry => ({
    id: uid('act'),
    actor,
    action,
    target,
    category,
    at: nowIso()
  });

  const decision = (
    workloadId: string,
    type: DecisionType,
    reason: string,
    resourceId: string | null = null
  ): SchedulingDecision => ({
    id: uid('dec'),
    workloadId,
    decision: type,
    resourceId,
    reason,
    decidedBy: actor,
    at: nowIso()
  });

  const commit = async (
    transform: (current: DataState) => DataState,
    ...entries: ActivityEntry[]
  ): Promise<ActionResult> => {
    if (!user) return fail('Sign in before changing workspace data.');
    if (!loadedRef.current) return fail('Workspace data is still loading. Try again shortly.');

    const previous = stateRef.current;
    const transformed = transform(previous);
    const next = entries.length
      ? { ...transformed, activity: [...entries, ...transformed.activity].slice(0, 300) }
      : transformed;

    stateRef.current = next;
    setState(next);

    try {
      await persistWorkspaceChanges(user.id, previous, next);
      return { ok: true };
    } catch (writeError) {
      if (stateRef.current === next) {
        stateRef.current = previous;
        setState(previous);
      }
      return fail(formatFirestoreError(writeError));
    }
  };

  const patchWorkload = (current: DataState, id: string, patch: Partial<Workload>): Workload[] =>
    current.workloads.map((workload) => workload.id === id ? { ...workload, ...patch } : workload);

  const releaseFor = (current: DataState, workloadId: string, at: string) =>
    current.allocations.map((allocation) =>
      allocation.workloadId === workloadId && allocation.releasedAt === null
        ? { ...allocation, releasedAt: at }
        : allocation
    );

  const findWorkload = (id: string) => stateRef.current.workloads.find((workload) => workload.id === id);

  const value: DataContextValue = {
    ...state,
    loading,
    error,
    retryLoad: () => setRetryCount((count) => count + 1),
    simulationOn,
    setSimulationOn,
    lastTick,

    addResource: async (input) => {
      const current = stateRef.current;
      if (current.resources.some((resource) => resource.name.toLowerCase() === input.name.trim().toLowerCase())) {
        return fail(`A resource named ${input.name} already exists.`);
      }
      const id = uid('res');
      const result = await commit(
        (s) => ({ ...s, resources: [{ ...input, name: input.name.trim(), id, createdAt: nowIso() }, ...s.resources] }),
        entry('registered GPU resource', input.name.trim(), 'resource')
      );
      return result.ok ? { ...result, id } : result;
    },

    updateResource: async (id, input) => {
      const current = stateRef.current.resources.find((resource) => resource.id === id);
      if (!current) return fail('Resource not found.');
      const normalizedName = input.name?.trim();
      if (normalizedName && stateRef.current.resources.some((resource) =>
        resource.id !== id && resource.name.toLowerCase() === normalizedName.toLowerCase())) {
        return fail(`A resource named ${input.name} already exists.`);
      }
      const statusChanged = input.status !== undefined && input.status !== current.status;
      return commit(
        (s) => ({ ...s, resources: s.resources.map((resource) => resource.id === id ? { ...resource, ...input } : resource) }),
        entry(
          statusChanged ? `set availability to ${input.status?.toLowerCase()} for` : 'updated GPU resource',
          input.name ?? current.name,
          'resource'
        )
      );
    },

    deleteResource: async (id) => {
      const current = stateRef.current;
      const resource = current.resources.find((item) => item.id === id);
      if (!resource) return fail('Resource not found.');
      if (usedGpus(id, current.allocations) > 0) return fail('Release active allocations before removing this resource.');
      return commit(
        (s) => ({ ...s, resources: s.resources.filter((item) => item.id !== id) }),
        entry('removed GPU resource', resource.name, 'resource')
      );
    },

    addWorkload: async (input) => {
      const id = nextWorkloadId(stateRef.current.workloads);
      const workload: Workload = {
        ...input,
        name: input.name.trim(),
        id,
        status: 'Pending',
        queueState: 'Queued',
        expectedStart: input.targetStart,
        recordedStart: null,
        completedAt: null,
        progress: 0,
        error: null,
        createdAt: nowIso()
      };
      const result = await commit(
        (s) => ({ ...s, workloads: [workload, ...s.workloads] }),
        entry('created workload request', `${id} · ${workload.name}`, 'workload')
      );
      return result.ok ? { ...result, id } : result;
    },

    updateWorkload: async (id, input) => {
      const workload = findWorkload(id);
      if (!workload) return fail('Workload not found.');
      return commit(
        (s) => ({ ...s, workloads: patchWorkload(s, id, input) }),
        entry('updated workload request', `${id} · ${input.name ?? workload.name}`, 'workload')
      );
    },

    deleteWorkload: async (id) => {
      const workload = findWorkload(id);
      if (!workload) return fail('Workload not found.');
      if (workload.status === 'Running') return fail('Stop or complete a running workload before deleting it.');
      const at = nowIso();
      return commit(
        (s) => ({
          ...s,
          workloads: s.workloads.filter((item) => item.id !== id),
          allocations: releaseFor(s, id, at)
        }),
        entry('deleted workload request', `${id} · ${workload.name}`, 'workload')
      );
    },

    transitionWorkload: async (id, to, errorMessage) => {
      const current = stateRef.current;
      const workload = current.workloads.find((item) => item.id === id);
      if (!workload) return fail('Workload not found.');
      if (!ALLOWED_TRANSITIONS[workload.status].includes(to)) {
        return fail(`Cannot move a ${workload.status.toLowerCase()} workload to ${to.toLowerCase()}.`);
      }
      const at = nowIso();
      const label = `${workload.id} · ${workload.name}`;

      if (to === 'Running') {
        const hasAllocation = current.allocations.some((allocation) =>
          allocation.workloadId === id && allocation.releasedAt === null);
        if (!hasAllocation) return fail('Assign a GPU resource before starting this workload.');
        return commit(
          (s) => ({
            ...s,
            workloads: patchWorkload(s, id, {
              status: 'Running', queueState: null, recordedStart: at, progress: 1, error: null
            })
          }),
          entry('started workload', label, 'execution')
        );
      }

      if (to === 'Approved') {
        return commit(
          (s) => ({
            ...s,
            workloads: patchWorkload(s, id, { status: 'Approved', queueState: workload.queueState ?? 'Queued' }),
            decisions: [decision(id, 'Approved', 'Requirements validated and approved for scheduling'), ...s.decisions]
          }),
          entry('approved workload', label, 'queue')
        );
      }

      if (to === 'Completed') {
        return commit(
          (s) => ({
            ...s,
            workloads: patchWorkload(s, id, {
              status: 'Completed', progress: 100, completedAt: at, queueState: null
            }),
            allocations: releaseFor(s, id, at)
          }),
          entry('completed workload', label, 'execution')
        );
      }

      if (to === 'Failed') {
        const message = errorMessage?.trim() || 'Marked as failed by operator.';
        return commit(
          (s) => ({
            ...s,
            workloads: patchWorkload(s, id, {
              status: 'Failed', completedAt: at, error: message, queueState: null
            }),
            allocations: releaseFor(s, id, at)
          }),
          entry('marked workload failed', label, 'execution')
        );
      }

      if (to === 'Pending') {
        return commit(
          (s) => ({
            ...s,
            workloads: patchWorkload(s, id, {
              status: 'Pending',
              queueState: 'Queued',
              progress: 0,
              error: null,
              recordedStart: null,
              completedAt: null,
              expectedStart: hoursFromNow(1)
            }),
            allocations: releaseFor(s, id, at),
            decisions: [
              decision(id, 'Requeued', workload.status === 'Failed' ? 'Retry requested after failure' : 'Returned to pending for review'),
              ...s.decisions
            ]
          }),
          entry('requeued workload', label, 'queue')
        );
      }

      return fail('Unsupported workload transition.');
    },

    allocate: async (workloadId, resourceId, gpus) => {
      const current = stateRef.current;
      const workload = current.workloads.find((item) => item.id === workloadId);
      const resource = current.resources.find((item) => item.id === resourceId);
      if (!workload || !resource) return fail('Select a valid workload and resource.');
      if (!Number.isInteger(gpus) || gpus < 1) return fail('Allocated capacity must be at least 1 GPU.');
      if (workload.status === 'Completed' || workload.status === 'Failed') {
        return fail('Completed or failed workloads cannot receive allocations.');
      }

      const conflict = detectConflict(resource, workload, gpus, current.allocations);
      const at = nowIso();
      const expected = new Date(workload.targetStart).getTime() > Date.now()
        ? workload.targetStart
        : hoursFromNow(0.25);
      const entries = [entry(`allocated ${gpus} GPU(s) to`, `${workload.id} → ${resource.name}`, 'allocation')];
      if (conflict) entries.unshift(entry('flagged allocation conflict on', resource.name, 'allocation'));

      const result = await commit(
        (s) => ({
          ...s,
          allocations: [
            {
              id: uid('alloc'),
              workloadId,
              resourceId,
              allocatedGpus: gpus,
              allocatedAt: at,
              releasedAt: null,
              conflict: !!conflict,
              conflictNote: conflict
            },
            ...s.allocations
          ],
          workloads: patchWorkload(s, workloadId, {
            status: workload.status === 'Pending' ? 'Approved' : workload.status,
            queueState: workload.status === 'Running' ? null : 'Assigned',
            expectedStart: workload.status === 'Running' ? workload.expectedStart : expected
          }),
          decisions: [
            decision(workloadId, 'Assigned', conflict ? `Flagged: ${conflict}` : `Allocated ${gpus} GPU(s) on ${resource.name}`, resourceId),
            ...s.decisions
          ]
        }),
        ...entries
      );
      return result.ok ? { ...result, conflict } : result;
    },

    delayWorkload: async (id, reason, hours) => {
      const workload = findWorkload(id);
      if (!workload) return fail('Workload not found.');
      if (!reason.trim()) return fail('Add a reason for the delay.');
      return commit(
        (s) => ({
          ...s,
          workloads: patchWorkload(s, id, { queueState: 'Delayed', expectedStart: hoursFromNow(hours) }),
          decisions: [decision(id, 'Delayed', `${reason.trim()}; expected start moved +${hours}h`), ...s.decisions]
        }),
        entry('delayed workload', `${workload.id} · ${workload.name}`, 'queue')
      );
    },

    requeueWorkload: async (id) => {
      const workload = findWorkload(id);
      if (!workload) return fail('Workload not found.');
      return commit(
        (s) => ({
          ...s,
          workloads: patchWorkload(s, id, { queueState: 'Queued', expectedStart: workload.targetStart }),
          decisions: [decision(id, 'Requeued', 'Returned to queue at original priority'), ...s.decisions]
        }),
        entry('requeued workload', `${workload.id} · ${workload.name}`, 'queue')
      );
    },

    releaseAllocation: async (id) => {
      const current = stateRef.current;
      const allocation = current.allocations.find((item) => item.id === id);
      if (!allocation) return fail('Allocation not found.');
      if (allocation.releasedAt) return fail('This allocation was already released.');
      const workload = current.workloads.find((item) => item.id === allocation.workloadId);
      const resource = current.resources.find((item) => item.id === allocation.resourceId);
      const otherActive = current.allocations.some((item) =>
        item.id !== id && item.workloadId === allocation.workloadId && item.releasedAt === null);
      const at = nowIso();
      return commit(
        (s) => ({
          ...s,
          allocations: s.allocations.map((item) =>
            item.id === id ? { ...item, releasedAt: at } : item),
          workloads: workload && workload.queueState === 'Assigned' && !otherActive
            ? patchWorkload(s, workload.id, { queueState: 'Queued' })
            : s.workloads
        }),
        entry('released allocation', `${allocation.workloadId} → ${resource?.name ?? allocation.resourceId}`, 'allocation')
      );
    },

    resolveConflict: async (id) => {
      const allocation = stateRef.current.allocations.find((item) => item.id === id);
      if (!allocation) return fail('Allocation not found.');
      const resource = stateRef.current.resources.find((item) => item.id === allocation.resourceId);
      return commit(
        (s) => ({
          ...s,
          allocations: s.allocations.map((item) =>
            item.id === id ? { ...item, conflict: false, conflictNote: null } : item)
        }),
        entry('resolved allocation conflict on', resource?.name ?? allocation.resourceId, 'allocation')
      );
    },

    resetData: () => commit(() => initialState())
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
