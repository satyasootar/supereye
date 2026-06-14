'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback, useEffect } from 'react';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { 
  Mail, Search, X, Archive, Trash2, ChevronLeft,
  Inbox, Send, FileText
} from 'lucide-react';
import { EmailReader } from './email-reader';
import { motion, AnimatePresence } from 'framer-motion';

type EmailMessage = {
  id: string;
  snippet: string;
  body?: string;
  subject: string;
  sender: string;
  isRead: boolean;
  isStarred: boolean;
  isLinkedToEvent: boolean;
  date: string;
  threadCount?: number;
  toAddresses?: any[];
};

export function EmailCompactPanel({ hideHeader = false }: { hideHeader?: boolean }) {
  const { selectedEmailId, setSelectedEmailId, emailCategory, setWorkspaceMode } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const [compactSelectedId, setCompactSelectedId] = useState<string | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['emails', 'threads', emailCategory],
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = emailCategory === 'DRAFT' 
        ? `/api/mail/drafts` 
        : `/api/mail/threads?offset=${pageParam}&category=${encodeURIComponent(emailCategory)}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch emails');
      const json = await res.json();
      return (json.messages || []) as EmailMessage[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === 20 ? allPages.length * 20 : undefined;
    }
  });

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
    },
  });

  const rawEmails = data?.pages.flat() || [];
  const emails = Array.from(new Map(rawEmails.map(e => [e.id, e])).values());

  const observer = useRef<IntersectionObserver | null>(null);
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1 });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isToday(d)) return format(d, 'h:mm a');
      if (isThisYear(d)) return format(d, 'MMM d');
      return format(d, 'MM/dd/yy');
    } catch { return ''; }
  };

  const handleEmailClick = (email: EmailMessage) => {
    setCompactSelectedId(email.id);
    setSelectedEmailId(email.id);
    if (!email.isRead) readMutation.mutate(email.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-surface">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle flex-shrink-0 bg-bg-surface/50">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-accent-blue" />
            <span className="text-[14px] font-semibold text-text-primary">Inbox</span>
          </div>
          <button
            onClick={() => setWorkspaceMode('email')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Focus on Email
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-overlay border border-border-subtle focus-within:border-accent-blue transition-colors">
          <Search className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[12px] text-text-primary placeholder:text-text-muted w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Email List or Reader */}
      <AnimatePresence mode="wait">
        {compactSelectedId ? (
          <motion.div
            key="reader"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {/* Back button */}
            <button
              onClick={() => { setCompactSelectedId(null); setSelectedEmailId(null); }}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-text-secondary hover:text-text-primary border-b border-border-subtle transition-colors flex-shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to inbox
            </button>
            <div className="min-h-0 flex-1 overflow-hidden">
              <EmailReader />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
          >
            {isLoading ? (
              <div className="flex flex-col gap-2 w-full p-3 animate-pulse">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col gap-2 p-2.5 border border-border-subtle/50 rounded-lg bg-bg-app/40"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-3.5 bg-border-default/40 rounded w-2/5" />
                      <div className="h-3 bg-border-default/30 rounded w-10" />
                    </div>
                    <div className="h-3 bg-border-default/35 rounded w-11/12" />
                    <div className="h-3 bg-border-default/20 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-[13px]">No emails found.</div>
            ) : (
              <div className="flex flex-col">
                {emails.map(email => {
                  let displaySender = email.sender ? email.sender.split('<')[0].replace(/["']/g, '').trim() : 'Unknown';
                  if (!displaySender && email.sender) displaySender = email.sender.replace(/[<>]/g, '').trim();

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={cn(
                        "flex flex-col gap-0.5 px-4 py-2.5 border-b border-border-subtle/50 cursor-pointer transition-colors hover:bg-bg-overlay",
                        !email.isRead && "bg-bg-highlight/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "truncate text-[13px]",
                          !email.isRead ? "font-semibold text-text-primary" : "text-text-secondary"
                        )}>
                          {displaySender}
                        </span>
                        <span className="text-[11px] text-text-muted flex-shrink-0">
                          {formatDisplayDate(email.date)}
                        </span>
                      </div>
                      <span className={cn(
                        "truncate text-[12px]",
                        !email.isRead ? "font-medium text-text-primary" : "text-text-muted"
                      )}>
                        {email.subject || '(No Subject)'}
                      </span>
                      <span className="truncate text-[11px] text-text-muted/70 leading-relaxed">
                        {email.snippet}
                      </span>
                    </div>
                  );
                })}
                <div ref={observerTarget} className="h-4 w-full" />
                {isFetchingNextPage && (
                  <div className="py-3 text-center text-[12px] text-text-muted">Loading more...</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
