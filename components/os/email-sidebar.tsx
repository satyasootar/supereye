'use client';

import { useSession } from 'next-auth/react';
import { 
  Inbox, Star, Clock, Send, FileText, Mail, AlertOctagon, Trash2, 
  ChevronDown, Plus, Settings, HelpCircle, HardDrive, Edit, 
  BarChart, Flame, Paperclip, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const primaryNav = [
  { icon: Inbox, label: 'Inbox', count: 12, active: true },
  { icon: Send, label: 'Sent' },
  { icon: Trash2, label: 'Trash' },
];

const labels = [
  { color: 'bg-blue-500', label: 'Updates', count: '99+' },
  { color: 'bg-green-500', label: 'Daily UI', count: '7' },
  { color: 'bg-purple-500', label: 'Social', count: '99+' },
  { color: 'bg-yellow-500', label: 'Promotions', count: '99+' },
  { color: 'bg-gray-500', label: 'GitHub', count: '99+' },
];

import { useAppStore } from '@/lib/store/app-store';

export function EmailSidebar() {
  const { data: session } = useSession();
  const { activeTabs } = useAppStore();
  const isSplit = activeTabs.length > 1;

  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [viewsExpanded, setViewsExpanded] = useState(true);
  const [triageExpanded, setTriageExpanded] = useState(false);

  if (isSplit) {
    return (
      <div className="flex h-full w-[48px] flex-col items-center border-r border-border-subtle bg-bg-surface text-text-primary py-4 gap-4 flex-shrink-0">
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue text-white hover:bg-accent-blue-dim transition-colors" title="Compose">
          <Edit className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-2 mt-4">
          {primaryNav.map((item) => (
            <button 
              key={item.label}
              title={item.label}
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
    <div className="flex h-full w-[220px] flex-col border-r border-border-subtle bg-bg-surface text-text-primary overflow-y-auto custom-scrollbar">
      {/* Account Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 hover:bg-bg-overlay cursor-pointer transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          {session?.user?.image ? (
             <img src={session.user.image} alt="User" className="h-6 w-6 rounded-full" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {session?.user?.name?.charAt(0) || '?'}
            </div>
          )}
          <span className="truncate text-[13.5px] font-medium">{session?.user?.email || 'Account'}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-text-secondary flex-shrink-0" />
      </div>

      <div className="px-3 py-2">
        {/* Compose Button */}
        <button className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-accent-blue text-[14px] font-semibold text-white shadow-sm hover:bg-accent-blue-dim transition-colors group relative">
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
            {item.count && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                item.active ? "bg-accent-blue text-white" : "text-text-muted"
              )}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Labels */}
      <div className="mt-4 px-2">
        <button 
          onClick={() => setLabelsExpanded(!labelsExpanded)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary uppercase tracking-wider group"
        >
          <div className="flex items-center gap-1">
            <ChevronDown className={cn("h-3 w-3 transition-transform", !labelsExpanded && "-rotate-90")} />
            Labels
          </div>
          <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        {labelsExpanded && (
          <div className="mt-1 flex flex-col gap-0.5">
            {labels.map((label) => (
              <button key={label.label} className="flex items-center justify-between rounded-md px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-overlay hover:text-text-primary">
                <div className="flex items-center gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full", label.color)} />
                  {label.label}
                </div>
                {label.count && <span className="text-[11px] text-text-muted">{label.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Views */}
      <div className="mt-4 px-2">
        <button 
          onClick={() => setViewsExpanded(!viewsExpanded)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary uppercase tracking-wider"
        >
          <div className="flex items-center gap-1">
            <ChevronDown className={cn("h-3 w-3 transition-transform", !viewsExpanded && "-rotate-90")} />
            Views
          </div>
        </button>
        
        {viewsExpanded && (
          <div className="mt-1 flex flex-col gap-0.5">
            {views.map((view) => (
              <button key={view.label} className="flex items-center justify-between rounded-md px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-overlay hover:text-text-primary">
                <div className="flex items-center gap-3">
                  <view.icon className="h-4 w-4" />
                  {view.label}
                </div>
                {view.count && <span className="text-[11px] bg-bg-highlight text-accent-blue px-1.5 py-0.5 rounded font-mono">{view.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Triage */}
      <div className="mt-4 px-2 mb-6">
        <button 
          onClick={() => setTriageExpanded(!triageExpanded)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-[12px] font-semibold text-accent-blue hover:text-accent-blue-dim uppercase tracking-wider bg-accent-blue-glow/30 rounded-md"
        >
          <div className="flex items-center gap-1">
            <ChevronDown className={cn("h-3 w-3 transition-transform", !triageExpanded && "-rotate-90")} />
            AI Triage
          </div>
        </button>
        
        {triageExpanded && (
          <div className="mt-1 flex flex-col gap-0.5">
            {triage.map((item) => (
              <button key={item.label} className="flex items-center justify-between rounded-md px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-overlay hover:text-text-primary">
                <div className="flex items-center gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                  {item.label}
                </div>
                {item.count && <span className="text-[11px] text-text-muted">{item.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col gap-1 p-3 border-t border-border-subtle text-[12.5px] text-text-secondary">
        <button className="flex items-center gap-2 hover:text-text-primary transition-colors py-1">
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button className="flex items-center gap-2 hover:text-text-primary transition-colors py-1">
          <HelpCircle className="h-4 w-4" />
          Help & Shortcuts
        </button>
        <button className="flex items-center justify-between gap-2 hover:text-text-primary transition-colors py-1 mt-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
          </div>
          <span className="text-[10px] text-text-muted">8.2 / 15 GB</span>
        </button>
      </div>
    </div>
  );
}
