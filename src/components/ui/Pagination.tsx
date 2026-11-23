import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, total, pageSize, onChange }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-soft">
      <span>
        Showing <span className="font-semibold text-ink">{from}–{to}</span> of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className="icon-btn h-8 w-8" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium">
          {page} / {pageCount}
        </span>
        <button type="button" className="icon-btn h-8 w-8" onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Next page">
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>);

}