import type {
  Allocation,
  GpuResource,
  Priority,
  Workload,
  WorkloadStatus } from
'../types/infrastructure';

export const PRIORITY_RANK: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export const ALLOWED_TRANSITIONS: Record<WorkloadStatus, WorkloadStatus[]> = {
  Pending: ['Approved', 'Failed'],
  Approved: ['Running', 'Pending', 'Failed'],
  Running: ['Completed', 'Failed'],
  Completed: [],
  Failed: ['Pending']
};

export type EffectiveStatus =
'Available' |
'Partially allocated' |
'Fully allocated' |
'Maintenance' |
'Offline';

export function sortByPriority(workloads: Workload[]): Workload[] {
  return [...workloads].sort((a, b) => {
    const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (diff !== 0) return diff;
    return new Date(a.targetStart).getTime() - new Date(b.targetStart).getTime();
  });
}

export function isActive(a: Allocation): boolean {
  return a.releasedAt === null;
}

export function usedGpus(resourceId: string, allocations: Allocation[]): number {
  return allocations.
  filter((a) => a.resourceId === resourceId && isActive(a)).
  reduce((sum, a) => sum + a.allocatedGpus, 0);
}

export function effectiveStatus(resource: GpuResource, allocations: Allocation[]): EffectiveStatus {
  if (resource.status !== 'Available') return resource.status;
  const used = usedGpus(resource.id, allocations);
  if (used === 0) return 'Available';
  if (used >= resource.capacity) return 'Fully allocated';
  return 'Partially allocated';
}

export function detectConflict(
resource: GpuResource,
workload: Workload | undefined,
gpus: number,
allocations: Allocation[])
: string | null {
  if (resource.status !== 'Available') {
    return `${resource.name} is marked ${resource.status.toLowerCase()}.`;
  }
  if (workload && workload.minMemoryGb > resource.memoryGb) {
    return `Workload requires ${workload.minMemoryGb} GB per GPU; ${resource.name} provides ${resource.memoryGb} GB.`;
  }
  const free = resource.capacity - usedGpus(resource.id, allocations);
  if (gpus > free) {
    return `Requested ${gpus} GPU(s) exceeds remaining capacity on ${resource.name} (${Math.max(free, 0)} of ${resource.capacity} free).`;
  }
  return null;
}

export function suggestResource(
workload: Workload,
resources: GpuResource[],
allocations: Allocation[])
: GpuResource | undefined {
  return resources.
  filter((r) => detectConflict(r, workload, workload.requestedGpus, allocations) === null).
  sort((a, b) => a.memoryGb - b.memoryGb)[0];
}

export function fleetSummary(resources: GpuResource[], allocations: Allocation[]) {
  let total = 0;
  let allocated = 0;
  let available = 0;
  let unavailable = 0;
  resources.forEach((r) => {
    total += r.capacity;
    if (r.status !== 'Available') {
      unavailable += r.capacity;
      return;
    }
    const used = Math.min(usedGpus(r.id, allocations), r.capacity);
    allocated += used;
    available += r.capacity - used;
  });
  const utilization = total ? Math.round(allocated / total * 100) : 0;
  return { total, allocated, available, unavailable, utilization };
}

export function trendPercent(series: number[]): number {
  if (series.length < 4) return 0;
  const n = Math.max(1, Math.floor(series.length / 4));
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const first = avg(series.slice(0, n));
  const last = avg(series.slice(-n));
  if (first === 0) return 0;
  return Math.round((last - first) / first * 1000) / 10;
}

export function nextWorkloadId(workloads: Workload[]): string {
  const max = workloads.reduce((m, w) => {
    const n = parseInt(w.id.replace('job-', ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 4800);
  return `job-${max + 1}`;
}