import React from 'react';
import { Toaster } from 'sonner';
import { Logo } from '../brand/Logo';
import { company, tickerEvents } from '../../data/company';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const points = [
{ value: 'Registry', label: 'Every GPU node, memory and capacity in one record' },
{ value: 'Queue', label: 'Priority-based scheduling decisions you can trace' },
{ value: 'Allocations', label: 'Conflicts flagged before jobs double-book a node' }];


export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#faf2e5] font-sans text-[#2b1b11]">
      <Toaster position="top-center" theme="light" />
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#543320] px-12 py-10 text-[#faf2e5] lg:flex">
          <Logo />
          <div className="max-w-xl">
            <p className="font-mono text-xs text-[#e6c9a8]">GPU workload scheduling platform</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] xl:text-6xl">
              Intelligent GPU Workload <em className="font-medium text-[#e0b48a]">Scheduling and Orchestration</em>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#ecdcc6]">
              Simplify GPU resource management, organize AI workloads, and gain clear visibility into compute allocation,
              execution, and utilization.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-[#faf2e5]/15 pt-6">
              {points.map((p) =>
              <div key={p.value}>
                  <dt className="font-display text-lg font-semibold text-[#faf2e5]">{p.value}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-[#d9c2a6]">{p.label}</dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <div className="-mx-12 overflow-hidden border-y border-[#faf2e5]/15 bg-[#3f2618] py-3" aria-hidden="true">
              <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-mono text-xs text-[#e6c9a8]">
                {[...tickerEvents, ...tickerEvents].map((t, i) =>
                <span key={i}>{t} &nbsp;•</span>
                )}
              </div>
            </div>
            <p className="mt-5 text-xs text-[#cdb497]">
              © {new Date().getFullYear()} Queldrin Digital Systems Inc. · {company.domain}
            </p>
          </div>
        </aside>
        <main className="relative flex items-center justify-center px-5 py-10 sm:px-10">
          <a
            href="https://queldrin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-5 top-5 rounded-lg px-3 py-2 text-sm font-semibold text-[#543320] transition-colors hover:bg-[#f4e9d8] hover:underline sm:right-10 sm:top-8">
            Back to site
          </a>
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>);

}