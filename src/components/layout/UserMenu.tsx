import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, HistoryIcon, LogOutIcon, UserCogIcon } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '../auth/UserAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  if (!user) return null;

  const go = (to: string) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface pl-1 pr-2 hover:bg-muted" aria-label="Account menu" aria-expanded={open}>
        <UserAvatar name={user.name} photoURL={user.photoURL} className="h-8 w-8 rounded-lg text-xs" />
        <ChevronDownIcon className="hidden h-4 w-4 text-ink-soft sm:block" />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          
            <div className="border-b border-line px-3 pb-3 pt-2">
              <div className="mb-2 flex items-center gap-2.5">
                <UserAvatar name={user.name} photoURL={user.photoURL} className="h-9 w-9 shrink-0 rounded-full text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink-soft">{user.email}</p>
                </div>
              </div>
              <p className="mt-2 inline-flex rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">{user.role}</p>
            </div>
            <div className="py-1">
              <button type="button" role="menuitem" onClick={() => go('/app/settings')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-muted">
                <UserCogIcon className="h-4 w-4 text-ink-soft" /> Profile & settings
              </button>
              <button type="button" role="menuitem" onClick={() => go('/app/activity')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-muted">
                <HistoryIcon className="h-4 w-4 text-ink-soft" /> Activity history
              </button>
              <button
              type="button"
              role="menuitem"
              onClick={async () => {
                const res = await logout();
                if (!res.ok) return toast.error(res.error);
                toast.success('Signed out.');
                navigate('/login');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10">
              
                <LogOutIcon className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}