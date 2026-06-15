'use client';

import { useAppStore, TabId } from '@/lib/store/app-store';
import { Bell, Keyboard, Moon, Sun, Search, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { NotificationBell } from './notification-bell';

export function TopBar() {
  const { activeTabs, openTab } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabClick = (e: React.MouseEvent, tab: TabId) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      openTab(tab, true);
    } else {
      openTab(tab, false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'email', label: 'Email' }
  ];

  return (
    <header className="sticky top-0 z-50 flex h-12 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 w-[200px]">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent-blue/10 text-accent-blue">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="font-heading text-[15px] font-semibold text-text-primary">Corsair</span>
      </div>

      {/* Center: Tabs */}
      <nav className="flex items-center gap-1 flex-1 justify-center">
        {tabs.map(tab => {
          const isActive = activeTabs.includes(tab.id);
          const isSplit = activeTabs.length > 1 && isActive;

          return (
            <button
              key={tab.id}
              onClick={(e) => handleTabClick(e, tab.id)}
              className={cn(
                "relative px-4 py-1.5 text-[13.5px] font-medium transition-colors rounded-[var(--radius-md)] select-none flex items-center gap-1.5",
                isActive 
                  ? "bg-bg-highlight text-text-primary" 
                  : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary"
              )}
            >
              {tab.label}
              {isSplit && (
                <div className="flex gap-[1px]">
                  <div className="h-2.5 w-1 bg-primary/50 rounded-[1px]" />
                  <div className="h-2.5 w-1 bg-primary/50 rounded-[1px]" />
                </div>
              )}
              {/* Active Tab Underline Indicator */}
              {isActive && !isSplit && activeTabs.length === 1 && (
                <div className="absolute bottom-[-10px] left-1/2 h-[2px] w-1/2 -translate-x-1/2 bg-accent-blue rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Utilities */}
      <div className="flex items-center justify-end w-[200px]">
        <button className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-[var(--radius-md)] hover:bg-bg-overlay cursor-pointer" title="Search (⌘K)">
          <Search className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
