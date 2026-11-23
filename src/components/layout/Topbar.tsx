import React, { useState } from 'react';
import { MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { NewRecordMenu } from './NewRecordMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onOpenMobile: () => void;
}

export function Topbar({ onOpenMobile }: TopbarProps) {
  const [mobileSearch, setMobileSearch] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="flex h-[76px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-10">
        <button type="button" onClick={onOpenMobile} className="icon-btn lg:hidden" aria-label="Open menu">
          <MenuIcon className="h-[18px] w-[18px]" />
        </button>
        <div className="hidden max-w-2xl flex-1 md:block">
          <GlobalSearch />
        </div>
        <div className="flex-1 md:hidden" />
        <button type="button" onClick={() => setMobileSearch((s) => !s)} className="icon-btn md:hidden" aria-label={mobileSearch ? 'Close search' : 'Open search'}>
          {mobileSearch ? <XIcon className="h-[18px] w-[18px]" /> : <SearchIcon className="h-[18px] w-[18px]" />}
        </button>
        <div className="flex items-center gap-2 sm:gap-3 md:ml-auto">
          <NewRecordMenu variant="topbar" />
          <ThemeToggle />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
      {mobileSearch &&
      <div className="px-4 pb-3 md:hidden">
          <GlobalSearch autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      }
    </header>);

}