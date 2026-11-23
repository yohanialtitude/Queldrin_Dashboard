import React, { createContext, useContext, useState } from 'react';

export type CreateKind = 'resource' | 'workload' | 'allocation';

interface CreateDefaults {
  workloadId?: string;
}

interface UIContextValue {
  createKind: CreateKind | null;
  createDefaults: CreateDefaults;
  openCreate: (kind: CreateKind, defaults?: CreateDefaults) => void;
  closeCreate: () => void;
  detailWorkloadId: string | null;
  openWorkload: (id: string) => void;
  closeWorkload: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: {children: React.ReactNode;}) {
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [createDefaults, setCreateDefaults] = useState<CreateDefaults>({});
  const [detailWorkloadId, setDetailWorkloadId] = useState<string | null>(null);

  return (
    <UIContext.Provider
      value={{
        createKind,
        createDefaults,
        openCreate: (kind, defaults = {}) => {
          setCreateDefaults(defaults);
          setCreateKind(kind);
        },
        closeCreate: () => setCreateKind(null),
        detailWorkloadId,
        openWorkload: (id) => setDetailWorkloadId(id),
        closeWorkload: () => setDetailWorkloadId(null)
      }}>
      
      {children}
    </UIContext.Provider>);

}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}