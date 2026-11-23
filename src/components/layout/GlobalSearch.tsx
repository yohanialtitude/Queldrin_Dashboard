import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CpuIcon, LayersIcon, SearchIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { StatusBadge } from '../ui/StatusBadge';

interface GlobalSearchProps {
  autoFocus?: boolean;
  onNavigate?: () => void;
}

export function GlobalSearch({ autoFocus, onNavigate }: GlobalSearchProps) {
  const { resources, workloads } = useData();
  const { openWorkload } = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapRef, close, open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return { res: [], wl: [] };
    return {
      res: resources.filter((r) => [r.name, r.type, r.location, r.environment].some((v) => v.toLowerCase().includes(q))).slice(0, 4),
      wl: workloads.filter((w) => [w.id, w.name, w.owner, w.type].some((v) => v.toLowerCase().includes(q))).slice(0, 5)
    };
  }, [q, resources, workloads]);

  const done = () => {
    setQuery('');
    setOpen(false);
    onNavigate?.();
  };

  const goResource = (name: string) => {
    navigate(`/app/resources?q=${encodeURIComponent(name)}`);
    done();
  };
  const goWorkload = (id: string) => {
    openWorkload(id);
    done();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.wl[0]) goWorkload(results.wl[0].id);else
    if (results.res[0]) goResource(results.res[0].name);
  };

  const empty = q && results.res.length === 0 && results.wl.length === 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search GPU resources, workloads, owners…"
          aria-label="Search"
          className="input h-11 pl-10 pr-10" />
        
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line px-1.5 text-xs text-ink-soft sm:block">/</kbd>
      </form>
      {open && q &&
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-xl">
          {empty && <p className="px-3 py-6 text-center text-sm text-ink-soft">No records match “{query}”.</p>}
          {results.wl.length > 0 &&
        <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-soft">Workloads</p>
              {results.wl.map((w) =>
          <button key={w.id} type="button" onClick={() => goWorkload(w.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted">
                  <LayersIcon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{w.name}</span>
                    <span className="block truncate font-mono text-xs text-ink-soft">{w.id} · {w.owner}</span>
                  </span>
                  <StatusBadge status={w.status} />
                </button>
          )}
            </div>
        }
          {results.res.length > 0 &&
        <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-soft">GPU resources</p>
              {results.res.map((r) =>
          <button key={r.id} type="button" onClick={() => goResource(r.name)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted">
                  <CpuIcon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm font-medium text-ink">{r.name}</span>
                    <span className="block truncate text-xs text-ink-soft">{r.type} · {r.location}</span>
                  </span>
                </button>
          )}
            </div>
        }
        </div>
      }
    </div>);

}