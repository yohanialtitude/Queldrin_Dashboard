import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ActivityIcon,
  ChevronLeftIcon,
  CpuIcon,
  HistoryIcon,
  LayersIcon,
  LayoutGridIcon,
  Link2Icon,
  ListOrderedIcon,
  LogOutIcon,
  SettingsIcon,
  TriangleAlertIcon,
  XIcon } from
'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../brand/Logo';
import { UserAvatar } from '../auth/UserAvatar';
import { NewRecordMenu } from './NewRecordMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const { resources, workloads, allocations } = useData();
  const navigate = useNavigate();
  const mini = collapsed && !mobileOpen;

  const conflicts = allocations.filter((a) => a.conflict && a.releasedAt === null).length;
  const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutGridIcon, count: undefined, end: true },
  { to: '/app/resources', label: 'GPU Resources', icon: CpuIcon, count: resources.length },
  { to: '/app/workloads', label: 'Workload Requests', icon: LayersIcon, count: workloads.filter((w) => w.status === 'Pending').length },
  { to: '/app/queue', label: 'Scheduling Queue', icon: ListOrderedIcon, count: workloads.filter((w) => w.queueState !== null).length },
  { to: '/app/allocations', label: 'Allocations', icon: Link2Icon, count: allocations.filter((a) => a.releasedAt === null).length },
  { to: '/app/monitoring', label: 'Execution Monitoring', icon: ActivityIcon, count: workloads.filter((w) => w.status === 'Running').length },
  { to: '/app/activity', label: 'Activity History', icon: HistoryIcon, count: undefined }];


  const handleLogout = async () => {
    const res = await logout();
    if (!res.ok) return toast.error(res.error);
    toast.success('Signed out.');
    navigate('/login');
  };

  const linkClass = ({ isActive }: {isActive: boolean;}) =>
  `group flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors duration-150 ${
  mini ? 'justify-center' : ''} ${
  isActive ? 'bg-accent-soft text-ink' : 'text-ink-soft hover:bg-muted hover:text-ink'}`;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-[#1a100a]/50 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[288px] flex-col border-r border-line bg-surface transition-[transform,width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${
        collapsed ? 'lg:w-[88px]' : 'lg:w-[288px]'}`}
        aria-label="Primary">
        
        <div className={`flex h-[76px] items-center border-b border-line px-5 ${mini ? 'justify-center px-0' : 'justify-between'}`}>
          {mini ?
          <button type="button" onClick={onToggleCollapse} aria-label="Expand sidebar">
              <Logo compact />
            </button> :

          <>
              <Logo />
              <button type="button" onClick={onToggleCollapse} className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-muted hover:text-ink lg:flex" aria-label="Collapse sidebar">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={onCloseMobile} className="icon-btn h-9 w-9 lg:hidden" aria-label="Close menu">
                <XIcon className="h-4 w-4" />
              </button>
            </>
          }
        </div>

        {user &&
        <div className={`border-b border-line px-5 py-5 ${mini ? 'px-0' : ''}`}>
            <div className={`flex items-center gap-3 ${mini ? 'justify-center' : ''}`}>
              <UserAvatar
                name={user.name}
                photoURL={user.photoURL}
                imageAlt={`${user.name} profile`}
                className="h-12 w-12 shrink-0 rounded-full border border-accent/30 text-sm"
              />
              {!mini &&
            <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-sm text-ink-soft">{user.email}</p>
                  <p className="truncate text-xs text-ink-soft">{user.role}</p>
                </div>
            }
            </div>
            {!mini &&
          <div className="mt-4 grid grid-cols-3 gap-2">
                <button type="button" className="icon-btn w-full" onClick={() => navigate('/app/activity')} aria-label="Activity history" title="Activity history">
                  <HistoryIcon className="h-4 w-4" />
                </button>
                <button type="button" className="icon-btn w-full" onClick={() => navigate('/app/settings')} aria-label="Settings" title="Settings">
                  <SettingsIcon className="h-4 w-4" />
                </button>
                <button type="button" className="icon-btn w-full" onClick={handleLogout} aria-label="Sign out" title="Sign out">
                  <LogOutIcon className="h-4 w-4" />
                </button>
              </div>
          }
          </div>
        }

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {!mini && <p className="mb-2 px-3 text-xs font-semibold text-ink-soft">Workspace</p>}
          <ul className="space-y-1">
            {nav.map((item) =>
            <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass} title={mini ? item.label : undefined}>
                  {({ isActive }) =>
                <>
                      <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-accent' : ''}`} />
                      {!mini && <span className="flex-1 truncate">{item.label}</span>}
                      {!mini && item.count !== undefined &&
                  <span className="rounded-md border border-line bg-surface px-1.5 text-xs font-semibold text-ink-soft">{item.count}</span>
                  }
                    </>
                }
                </NavLink>
              </li>
            )}
          </ul>
          {!mini && <p className="mb-2 mt-6 px-3 text-xs font-semibold text-ink-soft">Account</p>}
          <ul className={mini ? 'mt-4' : ''}>
            <li>
              <NavLink to="/app/settings" className={linkClass} title={mini ? 'Settings' : undefined}>
                <SettingsIcon className="h-[18px] w-[18px] shrink-0" />
                {!mini && <span>Settings</span>}
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className={`space-y-3 border-t border-line p-4 ${mini ? 'px-3' : ''}`}>
          <NewRecordMenu variant="sidebar" collapsed={mini} />
          {!mini &&
          <button
            type="button"
            onClick={() => navigate('/app/allocations?view=conflicts')}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm text-ink-soft hover:bg-muted">
            
              <span className="flex items-center gap-2">
                <TriangleAlertIcon className="h-4 w-4 text-danger" /> Conflict alerts
              </span>
              <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink">{conflicts} flagged</span>
            </button>
          }
        </div>
      </aside>
    </>);

}