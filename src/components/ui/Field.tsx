import React from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ?
      <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p> :
      hint ?
      <p className="mt-1.5 text-xs text-ink-soft">{hint}</p> :
      null}
    </div>);

}