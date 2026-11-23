import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CpuIcon, LayersIcon, Link2Icon, PlusIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CreateKind, useUI } from '../../contexts/UIContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { Permission } from '../../types/auth';

interface NewRecordMenuProps {
  variant: 'topbar' | 'sidebar';
  collapsed?: boolean;
}

const items: {kind: CreateKind;label: string;hint: string;icon: typeof CpuIcon;permission: Permission;}[] = [
{ kind: 'workload', label: 'Workload request', hint: 'Owner, requirements, priority', icon: LayersIcon, permission: 'manage_workloads' },
{ kind: 'resource', label: 'GPU resource', hint: 'Name, type, memory, capacity', icon: CpuIcon, permission: 'manage_resources' },
{ kind: 'allocation', label: 'Allocation record', hint: 'Assign workload to a GPU node', icon: Link2Icon, permission: 'manage_allocations' }];


export function NewRecordMenu({ variant, collapsed = false }: NewRecordMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { can } = useAuth();
  const { openCreate } = useUI();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const isSidebar = variant === 'sidebar';

  return (
    <div ref={ref} className={`relative ${isSidebar ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="New record"
        className={`btn-primary ${isSidebar ? 'h-12 w-full text-[15px]' : 'w-10 px-0 sm:w-auto sm:px-4'}`}>
        
        <PlusIcon className="h-4 w-4" />
        <span className={isSidebar ? collapsed ? 'sr-only' : '' : 'hidden sm:inline'}>New record</span>
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: isSidebar ? 6 : -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className={`z-50 rounded-2xl border border-line bg-surface p-1.5 shadow-xl ${
          isSidebar ?
          'absolute bottom-full left-0 mb-2 w-72 origin-bottom-left' :
          'fixed left-3 right-3 top-[72px] origin-top sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:origin-top-right'}`
          }>
          
            {items.map((item) => {
            const allowed = can(item.permission);
            return (
              <button
                key={item.kind}
                role="menuitem"
                type="button"
                disabled={!allowed}
                onClick={() => {
                  openCreate(item.kind);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent">
                
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-soft">{allowed ? item.hint : 'Your role cannot create this record'}</span>
                  </span>
                </button>);

          })}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}