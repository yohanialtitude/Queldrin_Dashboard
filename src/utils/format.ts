import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return format(new Date(iso), 'MMM d, HH:mm');
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy');
}

export function formatDayHeading(iso: string): string {
  return format(new Date(iso), 'EEEE, MMM d');
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes ? `${whole}h ${minutes}m` : `${whole}h`;
}

export function durationBetween(start?: string | null, end?: string | null): string {
  if (!start) return '—';
  const endMs = end ? new Date(end).getTime() : Date.now();
  return formatHours(Math.max(0, endMs - new Date(start).getTime()) / 3600000);
}

export function initials(name: string): string {
  return name.
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((p) => p[0]?.toUpperCase()).
  join('');
}

export function toDateTimeLocal(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600000).toISOString();
}