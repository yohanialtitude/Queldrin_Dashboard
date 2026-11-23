import React from "react";
import { BoxIcon } from "lucide-react";
interface EmptyStateProps {
  icon: BoxIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}
export function EmptyState({
  icon: Icon,
  title,
  message,
  action
}: EmptyStateProps) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>;
}