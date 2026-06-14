'use client';

import { useSession } from 'next-auth/react';
import { 
  Inbox, Star, Clock, Send, FileText, Mail, AlertOctagon, Trash2, 
  ChevronDown, Plus, Settings, HelpCircle, HardDrive, Edit, 
  BarChart, Flame, Paperclip, Users, Tag, ChevronLeft, ChevronRight, Calendar,
  Sun, Moon, User, Archive, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { NotificationBell } from './notification-bell';

const basePrimaryNav = [
  { icon: Inbox, label: 'Inbox', id: 'ALL' },
  { icon: FileText, label: 'Drafts', id: 'DRAFT' },
  { icon: Send, label: 'Sent', id: 'SENT' },
  { icon: Archive, label: 'Archive', id: 'ARCHIVE' },
  { icon: Trash2, label: 'Trash', id: 'TRASH' },
];

import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceLayout } from '@/hooks/use-workspace-layout';
import { CalendarSidebar } from './calendar-sidebar';
import { WorkspaceSwitcher } from './workspace-switcher';

export function EmailSidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { activeTabs, emailCategory, setEmailCategory, leftSidebarCollapsed, setLeftSidebarCollapsed } = useAppStore();
  const { primary, activePlugins } = useWorkspaceLayout();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const isSplit = activeTabs.length > 1;
  const isSidebarCollapsed = isSplit || leftSidebarCollapsed;

  const { data: unreadData } = useQuery({
    queryKey: ['emails', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/mail/unread');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: activePlugins.includes('email'),
    refetchInterval: 30000,
  });

  const { data: labelsData } = useQuery({
    queryKey: ['emails', 'labels'],
    queryFn: async () => {
      const res = await fetch('/api/mail/labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    },
    enabled: activePlugins.includes('email'),
    staleTime: 60000 * 5,
  });

  const [viewsExpanded, setViewsExpanded] = useState(true);
  const [triageExpanded, setTriageExpanded] = useState(false);

  const goToProfile = () => router.push('/workspace/profile');

  const springTransition = {
    type: 'spring' as const,
    stiffness: 280,
    damping: 32,
    mass: 0.9,
  };

  let content;

  const primaryNav = basePrimaryNav.map(item => {
    let count = 0;
    if (item.label === 'Inbox') {
      count = unreadData?.count || 0;
    }
    
    let active = false;
    if (item.id === 'ALL' && (emailCategory === 'ALL' || emailCategory === 'INBOX' || emailCategory.startsWith('CATEGORY_'))) {
      active = true;
    } else if (item.id === emailCategory) {
      active = true;
    }

    return { ...item, count, active };
  });

  const showCalendarNav = activePlugins.includes('calendar') && primary === 'calendar';
  const showEmailNav = activePlugins.includes('email') && !showCalendarNav;

  if (showCalendarNav) {
    if (isSidebarCollapsed) {
      content = (
        <div className="flex-1 w-[48px] overflow-hidden">
          <CalendarSidebar variant="default" />
        </div>
      );
    } else {
      content = (
        <div className="flex h-full w-[240px] flex-col bg-bg-surface">
          <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 border-b border-border-subtle bg-bg-surface">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-blue" />
              <span className="text-[14px] font-semibold text-text-primary">Calendar</span>
            </div>
            <button
              onClick={() => setLeftSidebarCollapsed(true)}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CalendarSidebar variant="default" />
          </div>
        </div>
      );
    }
  } else if (showEmailNav) {
    if (isSidebarCollapsed) {
      content = (
        <div className="flex h-full w-[48px] flex-col items-center bg-bg-surface text-text-primary py-3 gap-3">
          {leftSidebarCollapsed && !isSplit && (
            <button
              onClick={() => setLeftSidebarCollapsed(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <button 
            onClick={() => useAppStore.getState().setComposeOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue text-white hover:bg-accent-blue-dim transition-colors" 
            title="Compose"
          >
            <Edit className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-2 mt-2">
            {primaryNav.map((item) => (
              <button 
                key={item.label}
                title={item.label}
                onClick={() => setEmailCategory(item.id)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  item.active ? "bg-bg-highlight text-accent-blue" : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      content = (
        <div className="flex h-full w-[240px] flex-col bg-bg-surface text-text-primary">
          <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 border-b border-border-subtle bg-bg-surface">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent-blue" />
              <span className="text-[14px] font-semibold text-text-primary">Email</span>
            </div>
            <button
              onClick={() => setLeftSidebarCollapsed(true)}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="px-3 py-2 flex-shrink-0">
              <button 
                onClick={() => useAppStore.getState().setComposeOpen(true)}
                className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-accent-blue text-[14px] font-semibold text-white shadow-sm hover:bg-accent-blue-dim transition-colors group relative"
              >
                <Edit className="h-4 w-4" />
                Compose
                <span className="absolute right-2 flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">C</span>
              </button>
            </div>

            <nav className="mt-2 flex flex-col gap-0.5 px-2">
              {primaryNav.map((item) => (
                <button 
                  key={item.label}
                  onClick={() => setEmailCategory(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                    item.active 
                      ? "bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none" 
                      : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.count && item.count > 0 ? (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      item.active ? "bg-accent-blue text-white" : "text-text-muted"
                    )}>
                      {item.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>

            <div className="flex-1" />
          </div>
        </div>
      );
    }
  } else {
    content = (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
        <p className="text-[11px] text-text-muted">No plugins connected</p>
        <button
          type="button"
          onClick={() => router.push('/workspace/onboarding')}
          className="text-[11px] font-medium text-accent-blue hover:underline"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isSidebarCollapsed ? 48 : 240 }}
      transition={springTransition}
      className="h-full flex-shrink-0 border-r border-border-subtle bg-bg-surface overflow-hidden relative flex flex-col"
    >
      {!isSidebarCollapsed && (
        <div className="shrink-0 border-b border-border-subtle px-2 py-2">
          <WorkspaceSwitcher />
        </div>
      )}
      {isSidebarCollapsed && (
        <div className="flex shrink-0 justify-center border-b border-border-subtle py-2">
          <WorkspaceSwitcher collapsed />
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isSidebarCollapsed ? 'collapsed' : 'expanded'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="h-full"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Utilities (Profile, Theme, Notifications) */}
      <AnimatePresence initial={false}>
        {isSidebarCollapsed ? (
          <motion.div
            key="collapsed-utils"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border-subtle py-4 px-1 bg-bg-surface/30 flex flex-col items-center gap-4 flex-shrink-0"
          >
            <NotificationBell align="start" side="right" />
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-md hover:bg-bg-overlay cursor-pointer" 
              title="Toggle Theme"
            >
              {mounted && theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              type="button"
              onClick={goToProfile}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-highlight text-text-primary border border-border-subtle hover:bg-bg-overlay overflow-hidden flex-shrink-0 cursor-pointer"
              title={session?.user?.name || 'Profile'}
              aria-label="Open profile"
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded-utils"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border-subtle p-3 bg-bg-surface/30 flex items-center justify-between gap-2 flex-shrink-0"
          >
            <button
              type="button"
              onClick={goToProfile}
              className="flex items-center gap-2 overflow-hidden rounded-md px-1 py-0.5 transition-colors hover:bg-bg-overlay"
              aria-label="Open profile"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-highlight">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </span>
              <div className="flex flex-col text-left overflow-hidden max-w-[110px]">
                <span className="text-[12px] font-semibold text-text-primary truncate">{session?.user?.name || 'User'}</span>
                <span className="text-[10px] text-text-muted truncate">{session?.user?.email}</span>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <NotificationBell align="start" side="right" />
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-md hover:bg-bg-overlay cursor-pointer" 
                title="Toggle Theme"
              >
                {mounted && theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
