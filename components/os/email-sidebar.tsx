'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Inbox, Star, Clock, Send, FileText, Mail, AlertOctagon, Trash2, 
  ChevronDown, Plus, Settings, HelpCircle, HardDrive, Edit, 
  BarChart, Flame, Paperclip, Users, Tag,   ChevronLeft, ChevronRight, Calendar,
  Sun, Moon, User, Archive, PanelLeftClose, PanelLeftOpen, ArrowLeftRight, Sparkles,
  GitPullRequest,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { GithubSidebar } from './github-sidebar';
import { WorkspaceSwitcher } from './workspace-switcher';

export function EmailSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isBriefPage = pathname === '/workspace/brief';
  const { data: session } = useSession();
  const {
    activeTabs,
    emailCategory,
    setEmailCategory,
    emailPriorityFilter,
    setEmailPriorityFilter,
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
  } = useAppStore();
  const { primary, activePlugins, activeWorkspace, focusPlugin } = useWorkspaceLayout();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSwitchPlugin = () => {
    if (!activeWorkspace || activeWorkspace.pluginIds.length < 2) return;
    const currentPrimaryIndex = activeWorkspace.pluginIds.indexOf(primary);
    const nextIndex = (currentPrimaryIndex + 1) % activeWorkspace.pluginIds.length;
    const nextPluginId = activeWorkspace.pluginIds[nextIndex];
    focusPlugin(nextPluginId);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-menu-trigger="profile"]')) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);
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

  const { data: triageData } = useQuery({
    queryKey: ['emails', 'triage'],
    queryFn: async () => {
      const res = await fetch('/api/mail/triage');
      if (!res.ok) throw new Error('Failed to fetch triage summary');
      return res.json() as Promise<{
        urgent: number;
        canWait: number;
        pending: number;
      }>;
    },
    enabled: activePlugins.includes('email'),
    refetchInterval: 30000,
  });

  const [viewsExpanded, setViewsExpanded] = useState(true);

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
  const showGithubNav = activePlugins.includes('github') && primary === 'github';
  const showEmailNav = activePlugins.includes('email') && primary === 'email';

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
  } else if (showGithubNav) {
    if (isSidebarCollapsed) {
      content = (
        <div className="flex-1 w-[48px] overflow-hidden">
          <GithubSidebar variant="default" />
        </div>
      );
    } else {
      content = (
        <div className="flex h-full w-[240px] flex-col bg-bg-surface">
          <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 border-b border-border-subtle bg-bg-surface">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-text-primary" />
              <span className="text-[14px] font-semibold text-text-primary">GitHub</span>
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
            <GithubSidebar variant="default" />
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

            <div className="mt-4 px-2">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  AI Triage
                </span>
                {(triageData?.pending ?? 0) > 0 && (
                  <span className="text-[10px] font-medium text-text-muted animate-pulse">
                    Classifying…
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setEmailCategory('ALL');
                    setEmailPriorityFilter('all');
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors',
                    emailPriorityFilter === 'all'
                      ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                      : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Inbox className="h-4 w-4" />
                    All mail
                  </div>
                </button>
                <button
                  onClick={() => {
                    setEmailCategory('ALL');
                    setEmailPriorityFilter('urgent');
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors',
                    emailPriorityFilter === 'urgent'
                      ? 'bg-[color:var(--priority-urgent)]/10 text-[color:var(--priority-urgent)]'
                      : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Flame className="h-4 w-4" />
                    Urgent
                  </div>
                  {(triageData?.urgent ?? 0) > 0 && (
                    <span className="rounded-full bg-[color:var(--priority-urgent)]/15 px-2 py-0.5 text-[11px] font-bold">
                      {triageData?.urgent}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEmailCategory('ALL');
                    setEmailPriorityFilter('can_wait');
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors',
                    emailPriorityFilter === 'can_wait'
                      ? 'bg-[color:var(--priority-low)]/10 text-[color:var(--priority-low)]'
                      : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4" />
                    Can wait
                  </div>
                  {(triageData?.canWait ?? 0) > 0 && (
                    <span className="rounded-full bg-[color:var(--priority-low)]/15 px-2 py-0.5 text-[11px] font-bold">
                      {triageData?.canWait}
                    </span>
                  )}
                </button>
              </div>
            </div>

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
        <div className="shrink-0 border-b border-border-subtle px-2 py-2 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <WorkspaceSwitcher />
            </div>
            {activeWorkspace && activeWorkspace.pluginIds.length >= 2 && (
              <button
                type="button"
                onClick={handleSwitchPlugin}
                className="flex w-9 items-center justify-center rounded-md border border-border-subtle bg-bg-highlight/60 text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-primary self-stretch shrink-0 cursor-pointer"
                title="Switch Active Plugin"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <Link
            href="/workspace/brief"
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
              isBriefPage
                ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-text-primary ring-1 ring-violet-500/30'
                : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
            )}
          >
            <Sparkles className="h-4 w-4 text-violet-400" />
            Today
          </Link>
        </div>
      )}
      {isSidebarCollapsed && (
        <div className="flex shrink-0 flex-col items-center gap-2 border-b border-border-subtle py-2">
          <WorkspaceSwitcher collapsed />
          <Link
            href="/workspace/brief"
            title="Today"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              isBriefPage
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-text-secondary hover:bg-bg-overlay'
            )}
          >
            <Sparkles className="h-4 w-4" />
          </Link>
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
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-menu-trigger="profile"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full bg-bg-highlight text-text-primary border border-border-subtle hover:bg-bg-overlay overflow-hidden flex-shrink-0 cursor-pointer transition-colors",
                isMenuOpen && "border-accent-blue bg-bg-overlay"
              )}
              title={session?.user?.name || 'Profile Menu'}
              aria-label="Open profile menu"
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-menu-trigger="profile"
              className={cn(
                "flex items-center gap-2 overflow-hidden rounded-md px-1 py-0.5 transition-colors hover:bg-bg-overlay text-left cursor-pointer",
                isMenuOpen && "bg-bg-overlay"
              )}
              aria-label="Open profile menu"
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
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-menu-trigger="profile"
                className={cn(
                  "text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-md hover:bg-bg-overlay cursor-pointer",
                  isMenuOpen && "bg-bg-overlay text-text-primary"
                )}
                title="Open settings dropdown"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isMenuOpen && "rotate-180")} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown Menu Container */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute z-50 rounded-lg border border-border-subtle bg-bg-elevated p-1.5 shadow-xl flex flex-col min-w-[200px] select-none",
              isSidebarCollapsed 
                ? "left-14 bottom-4" 
                : "left-3 right-3 bottom-14"
            )}
          >
            <div className="px-2.5 py-1.5 border-b border-border-subtle/50 mb-1 flex flex-col">
              <span className="text-[12px] font-semibold text-text-primary truncate">
                {session?.user?.name || 'User'}
              </span>
              <span className="text-[10px] text-text-muted truncate mt-0.5">
                {session?.user?.email}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                goToProfile();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-text-secondary hover:bg-bg-overlay hover:text-text-primary transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-text-muted" />
              View Profile
            </button>
            
            <div className="h-px bg-border-subtle/40 my-1" />
            
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[12px]">
              <span className="text-text-secondary font-medium flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="h-3.5 w-3.5 text-text-muted" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-text-muted" />
                )}
                Dark Mode
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors cursor-pointer flex-shrink-0',
                  theme === 'dark' ? 'bg-accent-blue' : 'bg-bg-overlay'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    theme === 'dark' && 'translate-x-4'
                  )}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
