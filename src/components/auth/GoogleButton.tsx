import React from 'react';
import { GoogleIcon } from '../brand/GoogleIcon';

interface GoogleButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/** Follows Google's sign-in branding: white fill, #dadce0 border, #3c4043 Roboto label. */
export function GoogleButton({ label, onClick, disabled }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-4 font-google text-sm font-medium text-[#3c4043] transition-colors duration-150 hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/50 disabled:opacity-60">
      
      <GoogleIcon />
      {label}
    </button>);

}