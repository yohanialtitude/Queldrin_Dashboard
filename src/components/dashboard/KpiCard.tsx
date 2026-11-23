import React from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon, BoxIcon } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { CHART_COLORS } from "../../utils/chartTheme";
interface KpiCardProps {
  value: string;
  suffix?: string;
  label: string;
  icon: BoxIcon;
  trend: number;
  higherIsGood: boolean;
  series: number[];
  onClick: () => void;
}
export function KpiCard({
  value,
  suffix,
  label,
  icon: Icon,
  trend,
  higherIsGood,
  series,
  onClick
}: KpiCardProps) {
  const up = trend >= 0;
  const good = up === higherIsGood;
  const color = good ? CHART_COLORS.teal : CHART_COLORS.red;
  return <button type="button" onClick={onClick} className="card flex min-h-[200px] w-full min-w-0 flex-col p-5 text-left transition-colors duration-150 hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="flex min-w-0 flex-wrap items-baseline text-[clamp(2rem,3vw,2.5rem)] font-semibold leading-none tracking-tight text-ink tabular-nums">
          {value}
          {suffix && <span className="ml-1 text-base font-medium text-ink-soft">{suffix}</span>}
        </p>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 min-w-0 text-[15px] leading-snug text-ink-soft">{label}</p>
      <div className="mt-auto flex min-w-0 flex-wrap items-end justify-between gap-x-2 gap-y-2 pt-5">
        <span className={`inline-flex min-w-0 flex-1 flex-wrap items-center gap-x-1 text-sm font-semibold leading-snug ${good ? 'text-success' : 'text-danger'}`}>
          {up ? <ArrowUpRightIcon className="h-4 w-4" /> : <ArrowDownRightIcon className="h-4 w-4" />}
          {Math.abs(trend).toFixed(1)}%
          <span className="font-normal text-ink-soft">this period</span>
        </span>
        <div className="h-10 w-20 max-w-[35%] shrink-0" aria-hidden="true">
          <Sparkline data={series} color={color} />
        </div>
      </div>
    </button>;
}