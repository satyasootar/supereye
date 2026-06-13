'use client';

import { useSession } from 'next-auth/react';
import { 
  Inbox, Star, Clock, Send, FileText, Mail, AlertOctagon, Trash2, 
  ChevronDown, Plus, Settings, HelpCircle, HardDrive, Edit, 
  BarChart, Flame, Paperclip, Users, Tag, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const basePrimaryNav = [
  { icon: Inbox, label: 'Inbox', id: 'ALL' },
  { icon: FileText, label: 'Drafts', id: 'DRAFT' },
  { icon: Send, label: 'Sent', id: 'SENT' },
  { icon: Trash2, label: 'Trash', id: 'TRASH' },
];

import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import { CalendarSidebar } from './calendar-sidebar';

export function EmailSidebar() {
  const { data: session } = useSession();
  const { activeTabs, emailCategory, setEmailCategory, workspaceMode, leftSidebarCollapsed, setLeftSidebarCollapsed } = useAppStore();
  const isSplit = activeTabs.length > 1;
  const isSidebarCollapsed = isSplit || leftSidebarCollapsed;

  const { data: unreadData } = useQuery({
    queryKey: ['emails', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/mail/unread');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 30000, // refresh every 30 seconds
  });

  const { data: labelsData } = useQuery({
    queryKey: ['emails', 'labels'],
    queryFn: async () => {
      const res = await fetch('/api/mail/labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    },
    staleTime: 60000 * 5, // Cache labels for 5 minutes
  });

  const [viewsExpanded, setViewsExpanded] = useState(true);
  const [triageExpanded, setTriageExpanded] = useState(false);

  if (workspaceMode === 'calendar') {
    if (isSidebarCollapsed) {
      return <CalendarSidebar variant="default" />;
    }
    return (
      <div className="h-full w-[240px] flex-shrink-0 border-r border-border-subtle bg-bg-surface flex flex-col">
        {/* Header with Title and Collapse Button */}
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
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CalendarSidebar variant="default" />
        </div>
      </div>
    );
  }

  const primaryNav = basePrimaryNav.map(item => {
    let count = 0;
    if (item.label === 'Inbox') {
      count = unreadData?.count || 0;
    }
    
    // Determine active based on store
    let active = false;
    if (item.id === 'ALL' && (emailCategory === 'ALL' || emailCategory === 'INBOX' || emailCategory.startsWith('CATEGORY_'))) {
      active = true;
    } else if (item.id === emailCategory) {
      active = true;
    }

    return { ...item, count, active };
  });

  if (isSidebarCollapsed) {
    return (
      <div className="flex h-full w-[48px] flex-col items-center border-r border-border-subtle bg-bg-surface text-text-primary py-3 gap-3 flex-shrink-0">
        {/* Toggle Expand (only if not forced split view by activeTabs) */}
        {leftSidebarCollapsed && !isSplit && (
          <button
            onClick={() => setLeftSidebarCollapsed(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
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
  }

  return (
    <div className="flex h-full w-[240px] flex-col border-r border-border-subtle bg-bg-surface text-text-primary">
      {/* Header with Title and Collapse Button */}
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
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="px-3 py-2 flex-shrink-0">
          {/* Compose Button */}
          <button 
            onClick={() => useAppStore.getState().setComposeOpen(true)}
            className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-accent-blue text-[14px] font-semibold text-white shadow-sm hover:bg-accent-blue-dim transition-colors group relative"
          >
            <Edit className="h-4 w-4" />
            Compose
            <span className="absolute right-2 flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">C</span>
          </button>
        </div>

        {/* Primary Navigation */}
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

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </div>
  );
}
