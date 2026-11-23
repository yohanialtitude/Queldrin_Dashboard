import React from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

const toneClasses: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  brand: 'bg-accent/15 text-accent',
  neutral: 'bg-muted text-ink-soft'
};

const statusTone: Record<string, Tone> = {
  Available: 'success',
  'Partially allocated': 'info',
  'Fully allocated': 'brand',
  Maintenance: 'warning',
  Offline: 'neutral',
  Pending: 'neutral',
  Approved: 'info',
  Running: 'brand',
  Completed: 'success',
  Failed: 'danger',
  Queued: 'neutral',
  Assigned: 'info',
  Delayed: 'warning',
  Requeued: 'neutral',
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
  Active: 'success',
  Released: 'neutral',
  Conflict: 'danger'
};

interface StatusBadgeProps {
  status: string;
  dot?: boolean;
}

export function StatusBadge({ status, dot = true }: StatusBadgeProps) {
  const tone = statusTone[status] ?? 'neutral';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {status}
    </span>);

}