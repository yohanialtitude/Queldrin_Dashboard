import type {
  ActivityEntry,
  Allocation,
  GpuResource,
  SchedulingDecision,
  UtilizationPoint,
  Workload } from
'../types/infrastructure';

const HOUR = 3600000;
const at = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * HOUR).toISOString();

export const seedResources: GpuResource[] = [
{ id: 'res-01', name: 'gpu-node-01', type: 'NVIDIA H100 SXM 80GB', memoryGb: 80, capacity: 8, location: 'Los Angeles · Rack A1', environment: 'Production', status: 'Available', createdAt: at(-24 * 60) },
{ id: 'res-02', name: 'gpu-node-02', type: 'NVIDIA H100 SXM 80GB', memoryGb: 80, capacity: 8, location: 'Los Angeles · Rack A2', environment: 'Production', status: 'Available', createdAt: at(-24 * 58) },
{ id: 'res-03', name: 'gpu-node-03', type: 'NVIDIA A100 80GB', memoryGb: 80, capacity: 8, location: 'Los Angeles · Rack B1', environment: 'Production', status: 'Available', createdAt: at(-24 * 55) },
{ id: 'res-04', name: 'gpu-node-04', type: 'NVIDIA A100 40GB', memoryGb: 40, capacity: 4, location: 'Colombo · Rack C1', environment: 'Research', status: 'Available', createdAt: at(-24 * 50) },
{ id: 'res-05', name: 'gpu-node-05', type: 'NVIDIA L40S 48GB', memoryGb: 48, capacity: 4, location: 'Colombo · Rack C2', environment: 'Staging', status: 'Available', createdAt: at(-24 * 48) },
{ id: 'res-06', name: 'gpu-node-06', type: 'NVIDIA H200 141GB', memoryGb: 141, capacity: 8, location: 'Los Angeles · Rack A3', environment: 'Production', status: 'Available', createdAt: at(-24 * 40) },
{ id: 'res-07', name: 'gpu-node-07', type: 'NVIDIA A10G 24GB', memoryGb: 24, capacity: 4, location: 'Colombo · Rack C3', environment: 'Development', status: 'Available', createdAt: at(-24 * 36) },
{ id: 'res-08', name: 'gpu-node-08', type: 'NVIDIA L4 24GB', memoryGb: 24, capacity: 2, location: 'Colombo · Rack C4', environment: 'Development', status: 'Maintenance', createdAt: at(-24 * 30) },
{ id: 'res-09', name: 'gpu-node-09', type: 'NVIDIA A100 80GB', memoryGb: 80, capacity: 8, location: 'Los Angeles · Rack B2', environment: 'Research', status: 'Available', createdAt: at(-24 * 28) },
{ id: 'res-10', name: 'gpu-node-10', type: 'NVIDIA H100 PCIe 80GB', memoryGb: 80, capacity: 4, location: 'Los Angeles · Rack B3', environment: 'Staging', status: 'Available', createdAt: at(-24 * 20) },
{ id: 'res-11', name: 'gpu-node-11', type: 'NVIDIA RTX 6000 Ada 48GB', memoryGb: 48, capacity: 4, location: 'Colombo · Rack C5', environment: 'Research', status: 'Offline', createdAt: at(-24 * 14) },
{ id: 'res-12', name: 'gpu-node-12', type: 'NVIDIA H100 SXM 80GB', memoryGb: 80, capacity: 8, location: 'Los Angeles · Rack A4', environment: 'Production', status: 'Available', createdAt: at(-24 * 10) }];


export const seedWorkloads: Workload[] = [
{ id: 'job-4801', name: 'llama-3-70b-finetune', owner: 'Priya Raman', type: 'Fine-tuning', requirements: 'PyTorch 2.4, NCCL, NVLink preferred, checkpoint every 2h', requestedGpus: 8, minMemoryGb: 80, estimatedHours: 36, priority: 'High', targetStart: at(-22), status: 'Running', queueState: null, expectedStart: at(-22), recordedStart: at(-21.5), completedAt: null, progress: 62, error: null, createdAt: at(-30) },
{ id: 'job-4807', name: 'vit-huge-pretrain', owner: 'Marcus Chen', type: 'Training', requirements: 'JAX, 8× H200, checkpoints to object storage', requestedGpus: 8, minMemoryGb: 141, estimatedHours: 72, priority: 'Critical', targetStart: at(-26), status: 'Running', queueState: null, expectedStart: at(-26), recordedStart: at(-25), completedAt: null, progress: 34, error: null, createdAt: at(-40) },
{ id: 'job-4811', name: 'speech-train-v2', owner: 'Aisha Perera', type: 'Training', requirements: 'PyTorch, mixed precision, 4 GPUs with 80 GB', requestedGpus: 4, minMemoryGb: 80, estimatedHours: 18, priority: 'Medium', targetStart: at(-9), status: 'Running', queueState: null, expectedStart: at(-9), recordedStart: at(-8.5), completedAt: null, progress: 47, error: null, createdAt: at(-14) },
{ id: 'job-4815', name: 'batch-inference-catalog', owner: 'Daniel Okafor', type: 'Batch inference', requirements: 'Triton-compatible ONNX models, 4 GPUs', requestedGpus: 4, minMemoryGb: 40, estimatedHours: 2.25, priority: 'Medium', targetStart: at(-30), status: 'Completed', queueState: null, expectedStart: at(-30), recordedStart: at(-29.8), completedAt: at(-27.5), progress: 100, error: null, createdAt: at(-34) },
{ id: 'job-4818', name: 'rag-embeddings-refresh', owner: 'Lena Fischer', type: 'Data processing', requirements: 'Embedding model, 2 GPUs with 48 GB', requestedGpus: 2, minMemoryGb: 48, estimatedHours: 3, priority: 'Low', targetStart: at(-50), status: 'Completed', queueState: null, expectedStart: at(-50), recordedStart: at(-49), completedAt: at(-46), progress: 100, error: null, createdAt: at(-55) },
{ id: 'job-4819', name: 'diffusion-eval-suite', owner: 'Kavin Silva', type: 'Evaluation', requirements: 'Diffusion evaluation, 30 GB VRAM per GPU', requestedGpus: 2, minMemoryGb: 30, estimatedHours: 4, priority: 'Medium', targetStart: at(-12), status: 'Failed', queueState: null, expectedStart: at(-12), recordedStart: at(-11.5), completedAt: at(-11.2), progress: 18, error: 'CUDA out of memory on gpu-node-07: requested 30 GB, 24 GB available per GPU.', createdAt: at(-16) },
{ id: 'job-4820', name: 'recsys-ranking-train', owner: 'Daniel Okafor', type: 'Training', requirements: 'TensorFlow 2.16, 4 GPUs with 80 GB', requestedGpus: 4, minMemoryGb: 80, estimatedHours: 10, priority: 'High', targetStart: at(-4), status: 'Running', queueState: null, expectedStart: at(-4), recordedStart: at(-3.8), completedAt: null, progress: 38, error: null, createdAt: at(-8) },
{ id: 'job-4821', name: 'fraud-model-retrain', owner: 'Lena Fischer', type: 'Training', requirements: 'XGBoost GPU, 2 GPUs with 40 GB', requestedGpus: 2, minMemoryGb: 40, estimatedHours: 5, priority: 'High', targetStart: at(2), status: 'Pending', queueState: 'Queued', expectedStart: at(2), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-3) },
{ id: 'job-4822', name: 'llm-safety-eval', owner: 'Priya Raman', type: 'Evaluation', requirements: 'Eval harness v0.4, 4 GPUs with 80 GB', requestedGpus: 4, minMemoryGb: 80, estimatedHours: 6, priority: 'Critical', targetStart: at(1), status: 'Pending', queueState: 'Queued', expectedStart: at(1), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-2) },
{ id: 'job-4823', name: 'speech-train', owner: 'Aisha Perera', type: 'Fine-tuning', requirements: 'Whisper-large fine-tune, 4 GPUs with 80 GB', requestedGpus: 4, minMemoryGb: 80, estimatedHours: 12, priority: 'High', targetStart: at(0.5), status: 'Approved', queueState: 'Assigned', expectedStart: at(0.5), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-5) },
{ id: 'job-4824', name: 'protein-fold-sim', owner: 'Kavin Silva', type: 'Training', requirements: '8 GPUs with 80 GB, long-running simulation', requestedGpus: 8, minMemoryGb: 80, estimatedHours: 24, priority: 'Medium', targetStart: at(-1), status: 'Pending', queueState: 'Delayed', expectedStart: at(5), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-6) },
{ id: 'job-4825', name: 'genomics-batch', owner: 'Marcus Chen', type: 'Data processing', requirements: 'RAPIDS, 2 GPUs with 40 GB', requestedGpus: 2, minMemoryGb: 40, estimatedHours: 8, priority: 'Low', targetStart: at(3), status: 'Approved', queueState: 'Queued', expectedStart: at(3), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-4) },
{ id: 'job-4826', name: 'nim-inference-bench', owner: 'Daniel Okafor', type: 'Inference', requirements: 'Supported NIM container image, 1 GPU with 48 GB', requestedGpus: 1, minMemoryGb: 48, estimatedHours: 1.5, priority: 'Medium', targetStart: at(4), status: 'Pending', queueState: 'Queued', expectedStart: at(4), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-1.5) },
{ id: 'job-4827', name: 'triton-serving-canary', owner: 'Lena Fischer', type: 'Inference', requirements: 'Triton Inference Server, 2 GPUs, 5% canary traffic', requestedGpus: 2, minMemoryGb: 40, estimatedHours: 6, priority: 'High', targetStart: at(-2.2), status: 'Running', queueState: null, expectedStart: at(-2.2), recordedStart: at(-2), completedAt: null, progress: 30, error: null, createdAt: at(-6) },
{ id: 'job-4828', name: 'multilingual-asr-finetune', owner: 'Aisha Perera', type: 'Fine-tuning', requirements: '4 GPUs with 80 GB, multilingual corpus', requestedGpus: 4, minMemoryGb: 80, estimatedHours: 14, priority: 'High', targetStart: at(-20.5), status: 'Failed', queueState: null, expectedStart: at(-20.5), recordedStart: at(-20), completedAt: at(-16), progress: 41, error: 'Node heartbeat lost on gpu-node-12 after 4h 02m; job terminated by scheduler.', createdAt: at(-24) },
{ id: 'job-4829', name: 'doc-ocr-batch', owner: 'Kavin Silva', type: 'Batch inference', requirements: 'OCR pipeline, 2 GPUs with 24 GB', requestedGpus: 2, minMemoryGb: 24, estimatedHours: 1.5, priority: 'Low', targetStart: at(-7.2), status: 'Completed', queueState: null, expectedStart: at(-7.2), recordedStart: at(-7), completedAt: at(-5.5), progress: 100, error: null, createdAt: at(-10) },
{ id: 'job-4830', name: 'chatbot-distill', owner: 'Marcus Chen', type: 'Fine-tuning', requirements: 'Distillation, 4 GPUs with 80 GB', requestedGpus: 4, minMemoryGb: 80, estimatedHours: 16, priority: 'Medium', targetStart: at(-3), status: 'Pending', queueState: 'Delayed', expectedStart: at(8), recordedStart: null, completedAt: null, progress: 0, error: null, createdAt: at(-9) },
{ id: 'job-4831', name: 'tokenizer-benchmark', owner: 'Priya Raman', type: 'Evaluation', requirements: '1 GPU with 24 GB', requestedGpus: 1, minMemoryGb: 24, estimatedHours: 0.75, priority: 'Low', targetStart: at(-36.2), status: 'Completed', queueState: null, expectedStart: at(-36.2), recordedStart: at(-36), completedAt: at(-35.2), progress: 100, error: null, createdAt: at(-40) }];


export const seedAllocations: Allocation[] = [
{ id: 'alloc-1008', workloadId: 'job-4825', resourceId: 'res-03', allocatedGpus: 2, allocatedAt: at(-0.2), releasedAt: null, conflict: true, conflictNote: 'Requested 2 GPU(s) exceeds remaining capacity on gpu-node-03 (0 of 8 free).' },
{ id: 'alloc-1006', workloadId: 'job-4823', resourceId: 'res-03', allocatedGpus: 4, allocatedAt: at(-0.4), releasedAt: null, conflict: false, conflictNote: null },
{ id: 'alloc-1007', workloadId: 'job-4824', resourceId: 'res-01', allocatedGpus: 8, allocatedAt: at(-1.2), releasedAt: null, conflict: true, conflictNote: 'Requested 8 GPU(s) exceeds remaining capacity on gpu-node-01 (0 of 8 free).' },
{ id: 'alloc-1005', workloadId: 'job-4827', resourceId: 'res-09', allocatedGpus: 2, allocatedAt: at(-2.1), releasedAt: null, conflict: false, conflictNote: null },
{ id: 'alloc-1004', workloadId: 'job-4820', resourceId: 'res-03', allocatedGpus: 4, allocatedAt: at(-3.9), releasedAt: null, conflict: false, conflictNote: null },
{ id: 'alloc-0996', workloadId: 'job-4829', resourceId: 'res-10', allocatedGpus: 2, allocatedAt: at(-7.1), releasedAt: at(-5.5), conflict: false, conflictNote: null },
{ id: 'alloc-1003', workloadId: 'job-4811', resourceId: 'res-09', allocatedGpus: 4, allocatedAt: at(-8.6), releasedAt: null, conflict: false, conflictNote: null },
{ id: 'alloc-0995', workloadId: 'job-4819', resourceId: 'res-07', allocatedGpus: 2, allocatedAt: at(-11.6), releasedAt: at(-11.2), conflict: true, conflictNote: 'Workload requires 30 GB per GPU; gpu-node-07 provides 24 GB.' },
{ id: 'alloc-0989', workloadId: 'job-4828', resourceId: 'res-12', allocatedGpus: 4, allocatedAt: at(-20.1), releasedAt: at(-16), conflict: false, conflictNote: null },
{ id: 'alloc-1001', workloadId: 'job-4801', resourceId: 'res-01', allocatedGpus: 8, allocatedAt: at(-21.6), releasedAt: null, conflict: false, conflictNote: null },
{ id: 'alloc-1002', workloadId: 'job-4807', resourceId: 'res-06', allocatedGpus: 8, allocatedAt: at(-25.1), releasedAt: null, conflict: false, conflictNote: null },
{ id: 'alloc-0991', workloadId: 'job-4815', resourceId: 'res-02', allocatedGpus: 4, allocatedAt: at(-29.9), releasedAt: at(-27.5), conflict: false, conflictNote: null },
{ id: 'alloc-0980', workloadId: 'job-4831', resourceId: 'res-04', allocatedGpus: 1, allocatedAt: at(-36.1), releasedAt: at(-35.2), conflict: false, conflictNote: null },
{ id: 'alloc-0987', workloadId: 'job-4818', resourceId: 'res-05', allocatedGpus: 2, allocatedAt: at(-49.1), releasedAt: at(-46), conflict: false, conflictNote: null }];


export const seedDecisions: SchedulingDecision[] = [
{ id: 'dec-21', workloadId: 'job-4825', decision: 'Assigned', resourceId: 'res-03', reason: 'Flagged: gpu-node-03 already at full capacity', decidedBy: 'Yazhisaivarshini Nethran', at: at(-0.2) },
{ id: 'dec-20', workloadId: 'job-4823', decision: 'Assigned', resourceId: 'res-03', reason: 'High priority; 4 GPUs free on gpu-node-03', decidedBy: 'Scheduler (auto)', at: at(-0.4) },
{ id: 'dec-19', workloadId: 'job-4823', decision: 'Approved', resourceId: null, reason: 'Requirements validated by infrastructure manager', decidedBy: 'Yazhisaivarshini Nethran', at: at(-0.6) },
{ id: 'dec-18', workloadId: 'job-4824', decision: 'Delayed', resourceId: null, reason: 'gpu-node-01 fully allocated to job-4801; expected start moved +6h', decidedBy: 'Scheduler (auto)', at: at(-1) },
{ id: 'dec-17', workloadId: 'job-4827', decision: 'Assigned', resourceId: 'res-09', reason: 'Inference canary placed on Research pool', decidedBy: 'Scheduler (auto)', at: at(-2.1) },
{ id: 'dec-16', workloadId: 'job-4820', decision: 'Assigned', resourceId: 'res-03', reason: 'High priority; memory requirement met', decidedBy: 'Scheduler (auto)', at: at(-3.9) },
{ id: 'dec-15', workloadId: 'job-4830', decision: 'Delayed', resourceId: null, reason: 'Waiting for 4× 80 GB GPUs in Production', decidedBy: 'Scheduler (auto)', at: at(-5) },
{ id: 'dec-14', workloadId: 'job-4811', decision: 'Assigned', resourceId: 'res-09', reason: 'Medium priority; Research pool capacity available', decidedBy: 'Scheduler (auto)', at: at(-8.6) },
{ id: 'dec-13', workloadId: 'job-4819', decision: 'Assigned', resourceId: 'res-07', reason: 'Manual override by owner request', decidedBy: 'Yazhisaivarshini Nethran', at: at(-11.6) },
{ id: 'dec-12', workloadId: 'job-4801', decision: 'Assigned', resourceId: 'res-01', reason: 'NVLink node requested; full node available', decidedBy: 'Scheduler (auto)', at: at(-21.6) },
{ id: 'dec-11', workloadId: 'job-4807', decision: 'Assigned', resourceId: 'res-06', reason: 'Critical priority; H200 memory requirement', decidedBy: 'Scheduler (auto)', at: at(-25.1) }];


export const seedActivity: ActivityEntry[] = [
{ id: 'act-30', actor: 'Yazhisaivarshini Nethran', action: 'flagged allocation conflict on', target: 'gpu-node-03', category: 'allocation', at: at(-0.2) },
{ id: 'act-29', actor: 'Scheduler (auto)', action: 'allocated 4 GPU(s) to', target: 'job-4823 → gpu-node-03', category: 'allocation', at: at(-0.4) },
{ id: 'act-28', actor: 'Yazhisaivarshini Nethran', action: 'approved workload', target: 'job-4823 · speech-train', category: 'queue', at: at(-0.6) },
{ id: 'act-27', actor: 'Scheduler (auto)', action: 'delayed workload', target: 'job-4824 · protein-fold-sim', category: 'queue', at: at(-1) },
{ id: 'act-26', actor: 'Daniel Okafor', action: 'created workload request', target: 'job-4826 · nim-inference-bench', category: 'workload', at: at(-1.5) },
{ id: 'act-25', actor: 'Lena Fischer', action: 'started workload', target: 'job-4827 · triton-serving-canary', category: 'execution', at: at(-2) },
{ id: 'act-24', actor: 'Priya Raman', action: 'created workload request', target: 'job-4822 · llm-safety-eval', category: 'workload', at: at(-2) },
{ id: 'act-23', actor: 'Daniel Okafor', action: 'started workload', target: 'job-4820 · recsys-ranking-train', category: 'execution', at: at(-3.8) },
{ id: 'act-22', actor: 'Scheduler (auto)', action: 'completed workload', target: 'job-4829 · doc-ocr-batch', category: 'execution', at: at(-5.5) },
{ id: 'act-21', actor: 'Yazhisaivarshini Nethran', action: 'recorded maintenance on', target: 'gpu-node-08', category: 'resource', at: at(-9) },
{ id: 'act-20', actor: 'Scheduler (auto)', action: 'marked workload failed', target: 'job-4819 · diffusion-eval-suite', category: 'execution', at: at(-11.2) },
{ id: 'act-19', actor: 'Scheduler (auto)', action: 'marked workload failed', target: 'job-4828 · multilingual-asr-finetune', category: 'execution', at: at(-16) },
{ id: 'act-18', actor: 'Yazhisaivarshini Nethran', action: 'set availability to offline for', target: 'gpu-node-11', category: 'resource', at: at(-18) },
{ id: 'act-17', actor: 'Scheduler (auto)', action: 'completed workload', target: 'job-4815 · batch-inference-catalog', category: 'execution', at: at(-27.5) },
{ id: 'act-16', actor: 'Yazhisaivarshini Nethran', action: 'registered GPU resource', target: 'gpu-node-12', category: 'resource', at: at(-240) },
{ id: 'act-15', actor: 'System', action: 'seeded demo records for', target: 'Queldrin workspace', category: 'system', at: at(-300) }];


export const utilizationHistory: UtilizationPoint[] = [
{ day: 'Oct 7', utilization: 58, allocated: 41, queued: 6, running: 5, completed: 4, failed: 0 },
{ day: 'Oct 8', utilization: 61, allocated: 43, queued: 7, running: 5, completed: 5, failed: 1 },
{ day: 'Oct 9', utilization: 64, allocated: 45, queued: 9, running: 6, completed: 6, failed: 0 },
{ day: 'Oct 10', utilization: 60, allocated: 42, queued: 8, running: 5, completed: 5, failed: 0 },
{ day: 'Oct 11', utilization: 55, allocated: 39, queued: 5, running: 4, completed: 3, failed: 1 },
{ day: 'Oct 12', utilization: 52, allocated: 36, queued: 4, running: 4, completed: 2, failed: 0 },
{ day: 'Oct 13', utilization: 63, allocated: 44, queued: 8, running: 6, completed: 6, failed: 0 },
{ day: 'Oct 14', utilization: 67, allocated: 47, queued: 10, running: 6, completed: 7, failed: 2 },
{ day: 'Oct 15', utilization: 70, allocated: 49, queued: 12, running: 7, completed: 8, failed: 1 },
{ day: 'Oct 16', utilization: 72, allocated: 50, queued: 11, running: 7, completed: 7, failed: 0 },
{ day: 'Oct 17', utilization: 68, allocated: 48, queued: 9, running: 6, completed: 6, failed: 0 },
{ day: 'Oct 18', utilization: 66, allocated: 46, queued: 8, running: 6, completed: 5, failed: 1 },
{ day: 'Oct 19', utilization: 59, allocated: 41, queued: 6, running: 5, completed: 4, failed: 0 },
{ day: 'Oct 20', utilization: 62, allocated: 43, queued: 7, running: 5, completed: 5, failed: 0 },
{ day: 'Oct 21', utilization: 71, allocated: 50, queued: 11, running: 7, completed: 7, failed: 1 },
{ day: 'Oct 22', utilization: 74, allocated: 52, queued: 13, running: 7, completed: 8, failed: 0 },
{ day: 'Oct 23', utilization: 76, allocated: 53, queued: 14, running: 8, completed: 9, failed: 2 },
{ day: 'Oct 24', utilization: 73, allocated: 51, queued: 12, running: 7, completed: 8, failed: 1 },
{ day: 'Oct 25', utilization: 69, allocated: 48, queued: 10, running: 6, completed: 6, failed: 0 },
{ day: 'Oct 26', utilization: 65, allocated: 46, queued: 8, running: 6, completed: 5, failed: 0 },
{ day: 'Oct 27', utilization: 70, allocated: 49, queued: 9, running: 6, completed: 7, failed: 1 },
{ day: 'Oct 28', utilization: 78, allocated: 55, queued: 13, running: 7, completed: 9, failed: 1 },
{ day: 'Oct 29', utilization: 81, allocated: 57, queued: 15, running: 8, completed: 10, failed: 0 },
{ day: 'Oct 30', utilization: 79, allocated: 55, queued: 14, running: 8, completed: 9, failed: 2 },
{ day: 'Oct 31', utilization: 75, allocated: 53, queued: 11, running: 7, completed: 8, failed: 1 },
{ day: 'Nov 1', utilization: 72, allocated: 50, queued: 10, running: 6, completed: 7, failed: 0 },
{ day: 'Nov 2', utilization: 77, allocated: 54, queued: 12, running: 7, completed: 8, failed: 1 },
{ day: 'Nov 3', utilization: 82, allocated: 57, queued: 15, running: 8, completed: 10, failed: 0 },
{ day: 'Nov 4', utilization: 80, allocated: 56, queued: 13, running: 7, completed: 9, failed: 1 },
{ day: 'Nov 5', utilization: 84, allocated: 59, queued: 12, running: 6, completed: 11, failed: 2 }];