import React from 'react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { ResourceForm } from './ResourceForm';
import { WorkloadForm } from './WorkloadForm';
import { AllocationForm } from './AllocationForm';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';

export function CreateRecordModals() {
  const { createKind, createDefaults, closeCreate, openWorkload } = useUI();
  const { addResource, addWorkload } = useData();

  return (
    <>
      <Modal open={createKind === 'resource'} onClose={closeCreate} title="Register GPU resource" description="Add a node to the registry with its type, memory, capacity and environment.">
        <ResourceForm
          submitLabel="Register resource"
          onCancel={closeCreate}
          onSubmit={async (values) => {
            const res = await addResource(values);
            if (!res.ok) return res.error ?? 'Could not register resource.';
            toast.success(`${values.name} registered`);
            closeCreate();
            return null;
          }} />
        
      </Modal>
      <Modal open={createKind === 'workload'} onClose={closeCreate} size="lg" title="New workload request" description="Requests enter the scheduling queue as Pending until approved and assigned.">
        <WorkloadForm
          submitLabel="Submit request"
          onCancel={closeCreate}
          onSubmit={async (values) => {
            const res = await addWorkload(values);
            if (!res.ok || !res.id) return res.error ?? 'Could not create workload.';
            const id = res.id;
            toast.success(`${id} added to the queue`, { action: { label: 'View', onClick: () => openWorkload(id) } });
            closeCreate();
            return null;
          }} />
        
      </Modal>
      <Modal open={createKind === 'allocation'} onClose={closeCreate} title="Record allocation" description="Associate a workload with GPU capacity. Potential conflicts are flagged on the record.">
        {createKind === 'allocation' && <AllocationForm defaultWorkloadId={createDefaults.workloadId} onDone={closeCreate} />}
      </Modal>
    </>);

}