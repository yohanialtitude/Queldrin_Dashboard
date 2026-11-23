import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DownloadIcon, HistoryIcon, SearchIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useData } from '../contexts/DataContext';
import { usePagination } from '../hooks/usePagination';
import type { ActivityCategory } from '../types/infrastructure';
import { downloadCsv } from '../utils/csv';
import { formatDayHeading, initials } from '../utils/format';
import { format } from 'date-fns';

const categories: {value: 'all' | ActivityCategory;label: string;}[] = [
{ value: 'all', label: 'All' },
{ value: 'resource', label: 'Resources' },
{ value: 'workload', label: 'Workloads' },
{ value: 'queue', label: 'Scheduling' },
{ value: 'allocation', label: 'Allocations' },
{ value: 'execution', label: 'Execution' },
{ value: 'system', label: 'System' }];


export function Activity() {
  const { activity } = useData();
  const [category, setCategory] = useState<'all' | ActivityCategory>('all');
  const [actor, setActor] = useState('all');
  const [query, setQuery] = useState('');
  const actors = Array.from(new Set(activity.map((a) => a.actor))).sort();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...activity].
    sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).
    filter((a) => (category === 'all' || a.category === category) && (actor === 'all' || a.actor === actor)).
    filter((a) => !q || `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q));
  }, [activity, category, actor, query]);

  const pager = usePagination(filtered, 15, `${category}|${actor}|${query}`);
  const groups = pager.pageItems.reduce<{day: string;items: typeof filtered;}[]>((acc, item) => {
    const day = formatDayHeading(item.at);
    const last = acc[acc.length - 1];
    if (last && last.day === day) last.items.push(item);else
    acc.push({ day, items: [item] });
    return acc;
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Search, filtering & activity history"
        title="Activity history"
        description="A traceable record of resource changes, workload requests, scheduling decisions, allocations and execution events."
        actions={
        <button
          type="button"
          className="btn-secondary h-11"
          disabled={filtered.length === 0}
          onClick={() => {
            downloadCsv('queldrin-activity.csv', filtered.map((a) => ({ Time: a.at, Actor: a.actor, Action: a.action, Target: a.target, Category: a.category })));
            toast.success(`${filtered.length} activity entries exported`);
          }}>
          
            <DownloadIcon className="h-4 w-4" /> Export log
          </button>
        } />
      

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            {categories.map((c) =>
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`h-8 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 ${category === c.value ? 'border-brand bg-brand text-brand-fg' : 'border-line text-ink-soft hover:bg-muted hover:text-ink'}`}>
              
                {c.label}
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input className="input pl-9" placeholder="Search actions or targets" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search activity" />
            </div>
            <select className="input" value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Actor">
              <option value="all">All people & systems</option>
              {actors.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ?
        <EmptyState icon={HistoryIcon} title="No activity found" message="Try another category or search term." /> :

        <>
            <div className="px-4 py-2 sm:px-6">
              {groups.map((g) =>
            <section key={g.day} className="py-4">
                  <h2 className="mb-3 text-xs font-semibold text-ink-soft">{g.day}</h2>
                  <ol className="space-y-3">
                    {g.items.map((a) =>
                <li key={a.id} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">{initials(a.actor)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink">
                            <span className="font-semibold">{a.actor}</span> <span className="text-ink-soft">{a.action}</span>{' '}
                            <span className="break-words font-mono text-[13px]">{a.target}</span>
                          </p>
                          <p className="text-xs capitalize text-ink-soft">{a.category} · {format(new Date(a.at), 'HH:mm')}</p>
                        </div>
                      </li>
                )}
                  </ol>
                </section>
            )}
            </div>
            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} />
          </>
        }
      </div>
    </div>);

}