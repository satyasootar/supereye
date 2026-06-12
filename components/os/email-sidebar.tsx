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


import { useAppStore } from '@/lib/store/app-store';

export function EmailSidebar() {
  const { data: session } = useSession();
  const { activeTabs } = useAppStore();
  const isSplit = activeTabs.length > 1;

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



      {/* Spacer */}
      <div className="flex-1" />


    </div>
  );
}
