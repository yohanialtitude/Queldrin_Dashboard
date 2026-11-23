import React from 'react';

interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedTabs<T extends string>({ options, value, onChange, label }: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`tab ${active ? 'tab-active' : ''}`}>
            
            {o.label}
            {o.count !== undefined &&
            <span className={`rounded-md px-1.5 text-xs ${active ? 'bg-accent-soft text-accent' : 'bg-surface/60 text-ink-soft'}`}>
                {o.count}
              </span>
            }
          </button>);

      })}
    </div>);

}