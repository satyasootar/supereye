'use client';

import { 
  Menu, Filter, Paperclip, CheckSquare, Square, 
  Archive, Trash2, Clock, CheckCircle2, Tag, 
  Plus, Settings, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

type EmailMessage = {
  id: string;
  snippet: string;
  body?: string;
  subject: string;
  sender: string;
  isRead: boolean;
  isStarred: boolean;
  isLinkedToEvent: boolean;
  date: string; // ISO Date String
};

export function EmailListFull({ isSplitView = false }: { isSplitView?: boolean }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { setSelectedEmailId } = useAppStore();
  
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

  const emails = data || [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isToday(d)) return format(d, 'h:mm a');
      if (isThisYear(d)) return format(d, 'MMM d');
      return format(d, 'MM/dd/yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg-app flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex h-[60px] flex-shrink-0 items-center justify-between px-6 border-b border-border-subtle bg-bg-app">
        <div className="flex items-center gap-3 text-text-primary">
          <Archive className="h-5 w-5 text-accent-blue" />
          <h1 className="text-[20px] font-heading font-semibold">Inbox</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-bg-surface text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
            <Tag className="h-3.5 w-3.5" />
            Auto label
          </button>
          <button className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors">
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border-subtle bg-bg-app overflow-x-auto no-scrollbar">
        <button className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap">
          <Tag className="h-3.5 w-3.5 text-accent-blue" />
          Categories: Not Promotions, Social...
          <Menu className="h-3 w-3 ml-1" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap">
          <Menu className="h-3.5 w-3.5" />
          Labels
          <Menu className="h-3 w-3 ml-1" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap">
          <CheckSquare className="h-3.5 w-3.5" />
          Is unread
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap">
          <Archive className="h-3.5 w-3.5" />
          Show archived
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap">
          <div className="h-3.5 w-3.5 rounded-full bg-accent-blue flex items-center justify-center">
             <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          From: Not "github.com"
          <Menu className="h-3 w-3 ml-1" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded border border-transparent hover:bg-bg-surface text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap ml-2">
          <Plus className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading emails...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load emails.</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No emails found. Please sync your inbox.</div>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            {emails.map(email => {
              const isChecked = selectedIds.includes(email.id);
              return (
                <HoverCard key={email.id} openDelay={400} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <div 
                      onClick={() => {
                        setSelectedEmailId(email.id);
                        if (!email.isRead) {
                          readMutation.mutate(email.id);
                        }
                      }}
                      className={cn(
                        "group relative flex items-center gap-4 px-3 py-2.5 border-b border-border-subtle hover:bg-bg-surface/50 transition-colors cursor-pointer rounded-md",
                        !email.isRead && "bg-bg-surface/20"
                      )}
                    >
                      {/* Left Controls & Sender */}
                      <div className={cn("flex items-center gap-3 flex-shrink-0", isSplitView ? "w-[140px]" : "w-[240px]")}>
                        <div className="flex items-center gap-2 w-12">
                          <div className="flex h-5 w-5 items-center justify-center">
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
                        </div>
                        <span className={cn("truncate text-[14px]", !email.isRead ? "font-semibold text-text-primary" : "text-text-secondary font-medium")}>
                          {email.sender.split('<')[0].trim()}
                        </span>
                      </div>

                      {/* Subject and Snippet */}
                      <div className="flex-1 flex items-center overflow-hidden gap-2">
                        <span className={cn("truncate text-[14px] flex-shrink-0", !email.isRead ? "font-semibold text-text-primary" : "text-text-primary font-medium")}>
                          {email.subject || '(No Subject)'}
                        </span>
                        <span className="truncate text-[14px] text-text-muted">
                          {email.snippet}
                        </span>
                      </div>

                      {/* Actions & Date */}
                      <div className={cn("flex items-center gap-4 justify-end flex-shrink-0", isSplitView ? "w-[60px]" : "w-[140px]")}>
                        {/* Hover Actions */}
                        <div className={cn("hidden group-hover:flex items-center gap-3 text-text-secondary bg-bg-app px-2 absolute", isSplitView ? "right-[40px]" : "right-[80px]")}>
                          <button className="hover:text-text-primary transition-colors" title="Archive" onClick={(e) => e.stopPropagation()}>
                            <Archive className="h-4 w-4" />
                          </button>
                          <button className="hover:text-destructive transition-colors" title="Delete" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="hover:text-text-primary transition-colors" title="Mark Read" onClick={(e) => e.stopPropagation()}>
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Date */}
                        {!isSplitView && (
                          <span className="text-[12px] font-medium text-text-muted group-hover:opacity-0 transition-opacity">
                            {formatDisplayDate(email.date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent 
                    align="center" 
                    side="bottom"
                    sideOffset={-20}
                    className="w-[380px] p-0 bg-bg-elevated border-border-subtle shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95"
                  >
                    <div className="p-5 max-h-[280px] overflow-hidden flex flex-col gap-3">
                      <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                        <div className="h-8 w-8 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent-blue font-semibold text-[14px]">
                            {email.sender.split('<')[0].trim().charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[14px] font-medium text-text-primary truncate">{email.subject || '(No Subject)'}</span>
                          <span className="text-[12px] text-text-muted truncate">{email.sender.split('<')[0].trim()}</span>
                        </div>
                      </div>
                      <div className="relative w-full h-[200px] bg-transparent rounded-md overflow-hidden pointer-events-none mt-2">
                        {email.body ? (
                          <div className="absolute top-0 left-0 w-[800px] h-[470px] origin-top-left" style={{ transform: 'scale(0.425)' }}>
                            <iframe 
                              srcDoc={`<style>body, html { background-color: transparent !important; color: #F2F4F7 !important; font-family: sans-serif; } * { color: inherit !important; background-color: transparent !important; }</style>${email.body}`} 
                              className="w-full h-full border-none"
                              sandbox=""
                              scrolling="no"
                            />
                          </div>
                        ) : (
                          <div className="text-[13px] text-text-secondary leading-relaxed line-clamp-6 whitespace-pre-wrap p-3">
                            {email.snippet}
                          </div>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
