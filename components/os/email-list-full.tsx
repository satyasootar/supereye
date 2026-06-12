'use client';

import { 
  Menu, Filter, Paperclip, CheckSquare, Square, 
  Archive, Trash2, Clock, CheckCircle2, Tag, 
  Plus, Settings, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { useTheme } from 'next-themes';

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

export type FilterCategory = 'INBOX' | 'CATEGORY_PROMOTIONS' | 'CATEGORY_SOCIAL' | 'CATEGORY_UPDATES' | 'ALL';

const CATEGORY_TABS: { id: FilterCategory; label: string }[] = [
  { id: 'ALL', label: 'All Mail' },
  { id: 'INBOX', label: 'Primary' },
  { id: 'CATEGORY_PROMOTIONS', label: 'Promotions' },
  { id: 'CATEGORY_SOCIAL', label: 'Social' },
  { id: 'CATEGORY_UPDATES', label: 'Updates' },
];

export function EmailListFull({ isSplitView = false }: { isSplitView?: boolean }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [category, setCategory] = useState<FilterCategory>('ALL');
  const setSelectedEmailId = useAppStore(state => state.setSelectedEmailId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [hoveredEmail, setHoveredEmail] = useState<EmailMessage | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, email: EmailMessage) => {
    if (isSplitView) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setMousePos({ x: e.clientX, y: e.clientY });
    hoverTimeout.current = setTimeout(() => {
      setHoveredEmail(email);
    }, 400);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSplitView) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredEmail(null);
  };
  
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['emails', 'threads', category],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/mail/threads?offset=${pageParam}&category=${category}`);
      if (!res.ok) throw new Error('Failed to fetch emails');
      const json = await res.json();
      return (json.messages || []) as EmailMessage[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === 20 ? allPages.length * 20 : undefined;
    }
  });

  const emails = data?.pages.flat() || [];
  const observer = useRef<IntersectionObserver | null>(null);
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });

    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const queryClient = useQueryClient();

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mail/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark read');
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['emails', 'threads'] });
      
      queryClient.setQueriesData({ queryKey: ['emails', 'threads'] }, (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: EmailMessage[]) => 
            page.map((m: EmailMessage) => m.id === id ? { ...m, isRead: true } : m)
          )
        };
      });
      return { id };
    },
    onError: (err, variables, context) => {
      // For simplicity, just invalidate on error
      queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
    },
  });

  const emailsToMap = emails;

  useEffect(() => {
    const newIds = emailsToMap.map(e => e.id);
    const currentIds = useAppStore.getState().currentEmailIds;
    if (newIds.length !== currentIds.length || newIds.some((id, i) => id !== currentIds[i])) {
      useAppStore.getState().setCurrentEmailIds(newIds);
    }
  }, [emailsToMap]);

  const toggleSelectAll = () => {
    if (selectedIds.length === emails.length && emails.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map(e => e.id));
    }
  };

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

      {/* Categories Toolbar */}
      <div className="flex-none px-4 py-2 border-b border-border-subtle bg-bg-surface/50 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              className={cn(
                "px-3 py-1.5 text-[13px] font-medium rounded-full whitespace-nowrap transition-colors",
                category === tab.id 
                  ? "bg-accent-blue/10 text-accent-blue" 
                  : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email List Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading emails...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load emails.</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No emails found. Please sync your inbox.</div>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            {emailsToMap.map(email => {
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
                      onMouseEnter={(e) => handleMouseEnter(e, email)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className={cn(
                        "group relative flex items-center gap-4 px-3 py-2.5 border-b border-border-subtle hover:bg-bg-surface/50 transition-colors cursor-pointer rounded-md",
                        !email.isRead && "bg-bg-surface/20"
                      )}
                    >
                      {/* Left Controls & Sender */}
                      <div className={cn("flex items-center gap-3 flex-shrink-0", isSplitView ? "w-[140px]" : "w-[240px]")}>
                        <div className="flex items-center gap-2 w-6">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <div className={cn("h-1.5 w-1.5 rounded-full", !email.isRead ? "bg-accent-blue" : "bg-transparent")} />
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
              );
            })}
              
            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-4 w-full" />
            {isFetchingNextPage && (
              <div className="py-4 text-center text-sm text-text-subtle">
                Loading more emails...
              </div>
            )}
          </div>
        )}
      </div>
      
      {hoveredEmail && !isSplitView && (
        <div 
          className="fixed z-[100] w-[380px] p-0 bg-bg-elevated border border-border shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 pointer-events-none"
          style={{ 
            left: mousePos.x + 20, 
            top: typeof window !== 'undefined' ? Math.min(mousePos.y + 20, window.innerHeight - 300) : mousePos.y + 20
          }}
        >
          <div className="p-5 max-h-[280px] overflow-hidden flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
              <div className="h-8 w-8 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                <span className="text-accent-blue font-semibold text-[14px]">
                  {hoveredEmail.sender.split('<')[0].trim().charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[14px] font-medium text-text-primary truncate">{hoveredEmail.subject || '(No Subject)'}</span>
                <span className="text-[12px] text-text-muted truncate">{hoveredEmail.sender.split('<')[0].trim()}</span>
              </div>
            </div>
            <div className="relative w-full h-[200px] bg-bg-elevated rounded-md overflow-hidden pointer-events-none mt-2">
              {hoveredEmail.body ? (
                <div className="absolute top-0 left-0 w-[800px] h-[470px] origin-top-left" style={{ transform: 'scale(0.425)' }}>
                  <iframe 
                    srcDoc={`<style>
                      :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
                      body, html { background-color: ${isDark ? '#14151A' : '#FFFFFF'} !important; color: ${isDark ? '#F2F4F7' : '#1A1D24'} !important; font-family: sans-serif; margin: 0; padding: 0; } 
                      * { background-color: ${isDark ? '#14151A' : '#FFFFFF'} !important; color: ${isDark ? '#F2F4F7' : '#1A1D24'} !important; border-color: ${isDark ? '#2A2D35' : '#E2E8F0'} !important; }
                      img { background-color: transparent !important; }
                    </style>${hoveredEmail.body}`} 
                    className="w-full h-full border-none bg-transparent"
                    sandbox=""
                    scrolling="no"
                  />
                </div>
              ) : (
                <div className="text-[13px] text-text-secondary leading-relaxed line-clamp-6 whitespace-pre-wrap p-3">
                  {hoveredEmail.snippet}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
