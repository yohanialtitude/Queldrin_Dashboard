import { collection, doc, runTransaction, writeBatch } from 'firebase/firestore';
import type { DataState } from '../types/infrastructure';
import { db } from '../firebase';
import { nowIso } from '../utils/format';

type WorkspaceCollection = keyof DataState;

const collectionNames: Record<WorkspaceCollection, string> = {
  resources: 'resources',
  workloads: 'workloads',
  allocations: 'allocations',
  decisions: 'decisions',
  activity: 'activity'
};

function workspaceCollection(uid: string, key: WorkspaceCollection) {
  return collection(db, 'users', uid, collectionNames[key]);
}

export async function initializeWorkspace(uid: string, seed: DataState): Promise<void> {
  const marker = doc(db, 'users', uid, 'metadata', 'workspace');

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(marker);
    if (snapshot.exists()) return;

    transaction.set(marker, { schemaVersion: 1, createdAt: nowIso() });
    for (const key of Object.keys(collectionNames) as WorkspaceCollection[]) {
      for (const item of seed[key]) {
        transaction.set(doc(workspaceCollection(uid, key), item.id), item);
      }
    }
  });
}

export async function persistWorkspaceChanges(
  uid: string,
  previous: DataState,
  next: DataState
): Promise<void> {
  const batch = writeBatch(db);
  let writeCount = 0;

  for (const key of Object.keys(collectionNames) as WorkspaceCollection[]) {
    const previousItems = new Map(previous[key].map((item) => [item.id, item]));
    const nextItems = new Map(next[key].map((item) => [item.id, item]));

    for (const [id, item] of nextItems) {
      const oldItem = previousItems.get(id);
      if (oldItem && JSON.stringify(oldItem) === JSON.stringify(item)) continue;
      batch.set(doc(workspaceCollection(uid, key), id), item);
      writeCount++;
    }

    for (const id of previousItems.keys()) {
      if (nextItems.has(id)) continue;
      batch.delete(doc(workspaceCollection(uid, key), id));
      writeCount++;
    }
  }

  if (writeCount > 0) await batch.commit();
}

export function formatFirestoreError(error: unknown): string {
  const firestoreError = error as { code?: unknown; message?: unknown };
  if (firestoreError?.code === 'permission-denied') {
    return 'Firestore denied this request. Verify the per-user Firestore security rules are deployed.';
  }
  if (firestoreError?.code === 'unavailable' || firestoreError?.code === 'network-request-failed') {
    return 'Firestore is unavailable. Check your internet connection and try again.';
  }
  if (typeof firestoreError?.message === 'string') return firestoreError.message;
  return 'Could not save workspace data. Please try again.';
}
