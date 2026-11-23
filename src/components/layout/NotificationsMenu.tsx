import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, CheckCheckIcon, ClockIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { timeAgo } from '../../utils/format';

const READ_KEY = 'queldrin_read_notifications';

interface NotificationItem {
  id: string;
  kind: 'failed' | 'conflict' | 'delayed';
  title: string;
  body: string;
  at: string;
  action: () => void;
}

const icons = {
  failed: <XCircleIcon className="h-4 w-4 text-danger" />,
  conflict: <TriangleAlertIcon className="h-4 w-4 text-danger" />,
  delayed: <ClockIcon className="h-4 w-4 text-warning" />
};

export function NotificationsMenu() {
  const { workloads, allocations, resources } = useData();
  const { openWorkload } = useUI();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(read));
  }, [read]);

  const items = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    workloads.
    filter((w) => w.status === 'Failed').
    forEach((w) =>
    list.push({ id: `fail-${w.id}`, kind: 'failed', title: `${w.id} · ${w.name} failed`, body: w.error ?? 'Execution failed.', at: w.completedAt ?? w.createdAt, action: () => openWorkload(w.id) })
    );
    allocations.
    filter((a) => a.conflict && a.releasedAt === null).
    forEach((a) => {
      const r = resources.find((x) => x.id === a.resourceId);
      list.push({ id: `conf-${a.id}`, kind: 'conflict', title: `Allocation conflict on ${r?.name ?? a.resourceId}`, body: a.conflictNote ?? 'Potential double booking.', at: a.allocatedAt, action: () => navigate('/app/allocations?view=conflicts') });
    });
    workloads.
    filter((w) => w.queueState === 'Delayed').
    forEach((w) =>
    list.push({ id: `delay-${w.id}`, kind: 'delayed', title: `${w.id} · ${w.name} delayed`, body: `Expected start ${timeAgo(w.expectedStart)}`, at: w.createdAt, action: () => navigate('/app/queue?view=Delayed') })
    );
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [workloads, allocations, resources, openWorkload, navigate]);

  const unread = items.filter((i) => !read.includes(i.id)).length;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="icon-btn relative" aria-label={`Notifications, ${unread} unread`} aria-expanded={open}>
        <BellIcon className="h-[18px] w-[18px]" />
        {unread > 0 &&
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-surface">{unread}</span>
        }
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="fixed left-3 right-3 top-[72px] z-50 origin-top-right rounded-2xl border border-line bg-surface shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <button type="button" onClick={() => setRead(items.map((i) => i.id))} disabled={unread === 0} className="inline-flex items-center gap-1 text-xs font-semibold text-accent disabled:opacity-40">
                <CheckCheckIcon className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            <ul className="max-h-[380px] overflow-y-auto p-1.5">
              {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-soft">You're all caught up.</li>}
              {items.map((item) => {
              const isUnread = !read.includes(item.id);
              return (
                <li key={item.id}>
                    <button
                    type="button"
                    onClick={() => {
                      setRead((r) => r.includes(item.id) ? r : [...r, item.id]);
                      item.action();
                      setOpen(false);
                    }}
                    className="flex w-full gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted">
                    
                      <span className="mt-0.5">{icons[item.kind]}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${isUnread ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{item.title}</span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-ink-soft">{item.body}</span>
                        <span className="mt-1 block text-[11px] text-ink-soft">{timeAgo(item.at)}</span>
                      </span>
                      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                    </button>
                  </li>);

            })}
            </ul>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}