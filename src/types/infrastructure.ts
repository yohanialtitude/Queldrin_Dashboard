export type ResourceAvailability = 'Available' | 'Maintenance' | 'Offline';
export type Environment = 'Production' | 'Staging' | 'Research' | 'Development';

export interface GpuResource {
  id: string;
  name: string;
  type: string;
  memoryGb: number;
  capacity: number;
  location: string;
  environment: Environment;
  status: ResourceAvailability;
  createdAt: string;
}

export type ResourceInput = Omit<GpuResource, 'id' | 'createdAt'>;

export type WorkloadType =
'Training' |
'Fine-tuning' |
'Inference' |
'Batch inference' |
'Evaluation' |
'Data processing';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type WorkloadStatus = 'Pending' | 'Approved' | 'Running' | 'Completed' | 'Failed';
export type QueueState = 'Queued' | 'Assigned' | 'Delayed';

export interface Workload {
  id: string;
  name: string;
  owner: string;
  type: WorkloadType;
  requirements: string;
  requestedGpus: number;
  minMemoryGb: number;
  estimatedHours: number;
  priority: Priority;
  targetStart: string;
  status: WorkloadStatus;
  queueState: QueueState | null;
  expectedStart: string | null;
  recordedStart: string | null;
  completedAt: string | null;
  progress: number;
  error: string | null;
  createdAt: string;
}

export type WorkloadInput = Pick<
  Workload,
  'name' |
  'owner' |
  'type' |
  'requirements' |
  'requestedGpus' |
  'minMemoryGb' |
  'estimatedHours' |
  'priority' |
  'targetStart'>;


export interface Allocation {
  id: string;
  workloadId: string;
  resourceId: string;
  allocatedGpus: number;
  allocatedAt: string;
  releasedAt: string | null;
  conflict: boolean;
  conflictNote: string | null;
}

export type DecisionType = 'Approved' | 'Assigned' | 'Delayed' | 'Requeued';

export interface SchedulingDecision {
  id: string;
  workloadId: string;
  decision: DecisionType;
  resourceId: string | null;
  reason: string;
  decidedBy: string;
  at: string;
}

export type ActivityCategory =
'resource' |
'workload' |
'queue' |
'allocation' |
'execution' |
'system';

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  category: ActivityCategory;
  at: string;
}

export interface UtilizationPoint {
  day: string;
  utilization: number;
  allocated: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

export interface DataState {
  resources: GpuResource[];
  workloads: Workload[];
  allocations: Allocation[];
  decisions: SchedulingDecision[];
  activity: ActivityEntry[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  conflict?: string | null;
  id?: string;
}