import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-accent">{eyebrow}</p>
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div>}
    </header>);

}