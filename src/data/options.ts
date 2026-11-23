import type { Environment, Priority, WorkloadType, ResourceAvailability } from '../types/infrastructure';
import type { Permission, Role } from '../types/auth';

export const gpuTypes = [
'NVIDIA H200 141GB',
'NVIDIA H100 SXM 80GB',
'NVIDIA H100 PCIe 80GB',
'NVIDIA A100 80GB',
'NVIDIA A100 40GB',
'NVIDIA L40S 48GB',
'NVIDIA RTX 6000 Ada 48GB',
'NVIDIA A10G 24GB',
'NVIDIA L4 24GB'];


export const environments: Environment[] = ['Production', 'Staging', 'Research', 'Development'];

export const availabilityOptions: ResourceAvailability[] = ['Available', 'Maintenance', 'Offline'];

export const workloadTypes: WorkloadType[] = [
'Training',
'Fine-tuning',
'Inference',
'Batch inference',
'Evaluation',
'Data processing'];


export const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export const owners = [
'Priya Raman',
'Marcus Chen',
'Aisha Perera',
'Daniel Okafor',
'Lena Fischer',
'Kavin Silva'];


export const roles: Role[] = ['Administrator', 'Infrastructure Manager', 'Engineer', 'Viewer'];

export const roleDescriptions: Record<Role, string> = {
  Administrator: 'Full access, including organization settings and demo data resets.',
  'Infrastructure Manager': 'Manages GPU resources, schedules workloads and records allocations.',
  Engineer: 'Creates and updates workload requests and monitors execution.',
  Viewer: 'Read-only access to resources, queues, allocations and history.'
};

export const permissionLabels: Record<Permission, string> = {
  manage_resources: 'Register & edit GPU resources',
  manage_workloads: 'Create & update workload requests',
  schedule: 'Approve, assign & delay queue items',
  manage_allocations: 'Record & release allocations',
  manage_settings: 'Organization settings & data reset'
};

export const rolePermissions: Record<Role, Permission[]> = {
  Administrator: ['manage_resources', 'manage_workloads', 'schedule', 'manage_allocations', 'manage_settings'],
  'Infrastructure Manager': ['manage_resources', 'manage_workloads', 'schedule', 'manage_allocations'],
  Engineer: ['manage_workloads'],
  Viewer: []
};

export const delayReasons = [
'Requested GPU type fully allocated',
'Waiting for higher-priority workload to finish',
'Resource under maintenance',
'Owner requested later start',
'Memory requirement not met by free nodes'];