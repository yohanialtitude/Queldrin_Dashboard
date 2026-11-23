import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const btn = (active: boolean) =>
  `flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ${
  active ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:text-ink'}`;

  return (
    <div className="flex h-10 items-center gap-0.5 rounded-xl border border-line bg-surface p-1" role="group" aria-label="Color theme">
      <button type="button" className={btn(theme === 'light')} onClick={() => setTheme('light')} aria-pressed={theme === 'light'} aria-label="Light theme">
        <SunIcon className="h-4 w-4" />
      </button>
      <button type="button" className={btn(theme === 'dark')} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} aria-label="Dark theme">
        <MoonIcon className="h-4 w-4" />
      </button>
    </div>);

}