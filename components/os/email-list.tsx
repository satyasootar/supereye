'use client';

import { 
  Menu, Filter, Paperclip, CheckSquare, Square, 
  Archive, Trash2, Clock, CheckCircle2, Tag 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type EmailMessage = {
  id: string;
  snippet: string;
  subject: string;
  sender: string;
  isRead: boolean;
  isStarred: boolean;
  isLinkedToEvent: boolean;
};

export function EmailList() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { setSelectedEmailId, selectedEmailId } = useAppStore();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['emails', 'threads'],
    queryFn: async () => {
      const res = await fetch('/api/mail/threads');
      if (!res.ok) throw new Error('Failed to fetch emails');
      const json = await res.json();
      return json.messages as EmailMessage[];
    }
  });

  const queryClient = useQueryClient();

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mail/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark read');
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['emails', 'threads'] });
      const previous = queryClient.getQueryData(['emails', 'threads']);
      
      queryClient.setQueryData(['emails', 'threads'], (old: any) => {
        if (!old) return old;
        return old.map((m: EmailMessage) => m.id === id ? { ...m, isRead: true } : m);
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['emails', 'threads'], context?.previous);
    },
  });

  const rawEmails = data || [];
  const emails = Array.from(new Map(rawEmails.map((e: EmailMessage) => [e.id, e])).values());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-full w-[380px] flex-col border-r border-border-subtle bg-bg-base overflow-hidden flex-shrink-0">
      {/* Header Row */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-surface">
        <span className="font-heading text-lg font-semibold text-text-primary">Inbox</span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors">
            <Menu className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar (Scrollable) */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-border-subtle">
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-accent-blue text-white text-[12px] font-medium">All</button>
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-bg-overlay text-text-secondary hover:text-text-primary text-[12px] font-medium transition-colors">Unread</button>
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-bg-overlay text-text-secondary hover:text-text-primary text-[12px] font-medium transition-colors">Starred</button>
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-bg-overlay text-text-secondary hover:text-text-primary text-[12px] font-medium transition-colors">Attachments</button>
      </div>

      {/* Sort Control */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle text-[11px] text-text-muted font-mono bg-bg-base z-10">
        <span>Sort: Newest ▾</span>
        <span>Density: Compact ▾</span>
      </div>

      {/* Email Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {isLoading ? (
          <div className="p-4 text-center text-text-muted text-[13px]">Loading emails...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-[13px]">Failed to load emails.</div>
        ) : emails.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-[13px]">No emails found. Please sync.</div>
        ) : (
          <div className="flex flex-col">
            {emails.map(email => {
              const isSelected = selectedEmailId === email.id;
              const isChecked = selectedIds.includes(email.id);
              
              return (
                <div 
                  key={email.id}
                  onClick={() => {
                    setSelectedEmailId(email.id);
                    if (!email.isRead) {
                      readMutation.mutate(email.id);
                    }
                  }}
                  className={cn(
                    "group relative flex flex-col gap-1 px-4 py-3 border-b border-border-subtle hover:bg-bg-overlay transition-colors cursor-pointer",
                    isSelected && "bg-bg-highlight border-l-2 border-l-accent-blue pl-[14px]",
                    !isSelected && !email.isRead && "bg-bg-surface/30"
                  )}
                >
                  {/* Top Row: Unread Dot, Avatar, Sender, Time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Left area: Dot -> Checkbox on hover */}
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        {isChecked ? (
                          <CheckSquare 
                            className="h-4 w-4 text-accent-blue" 
                            onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }} 
                          />
                        ) : (
                          <>
                            <div className={cn("h-1.5 w-1.5 rounded-full group-hover:hidden", !email.isRead ? "bg-accent-blue" : "bg-transparent")} />
                            <Square 
                              className="h-4 w-4 text-text-muted hidden group-hover:block hover:text-text-primary" 
                              onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }} 
                            />
                          </>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bg-elevated border border-border-default text-[10px] font-bold text-text-primary">
                        {email.sender.charAt(0).toUpperCase()}
                      </div>

                      <span className={cn("truncate text-[13.5px]", !email.isRead ? "font-semibold text-text-primary" : "font-medium text-text-secondary")}>
                        {email.sender.split('<')[0].trim()}
                      </span>
                    </div>

                    {/* Right Area */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {email.isLinkedToEvent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-white bg-blue-500">
                          Invite
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Subject & Preview */}
                  <div className="pl-9 pr-2">
                    <div className={cn("truncate text-[13.5px]", !email.isRead ? "font-semibold text-text-primary" : "font-medium text-text-primary")}>
                      {email.subject || '(No Subject)'}
                    </div>
                    <div className="relative h-[20px] overflow-hidden">
                      {/* Default Preview Text */}
                      <div className="absolute inset-0 truncate text-[13px] text-text-secondary group-hover:opacity-0 transition-opacity">
                        {email.snippet}
                      </div>
                      
                      {/* Hover Action Bar */}
                      <div className="absolute inset-0 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-200">
                        <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Archive">
                          <Archive className="h-4 w-4" />
                        </button>
                        <button className="flex items-center gap-1 text-text-secondary hover:text-destructive" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Snooze">
                          <Clock className="h-4 w-4" />
                        </button>
                        <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Mark Read">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Label">
                          <Tag className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
