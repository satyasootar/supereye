'use client';

import { 
  Menu, Filter, Tag, CheckCircle2, SlidersHorizontal, Square, 
  CheckSquare, Archive, Trash2, Clock, Calendar, MessageSquare, 
  MoreHorizontal, ChevronDown, Plus, Search, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisYear, subDays, isAfter } from 'date-fns';
import { useTheme } from 'next-themes';
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { AdvancedSearchFilter } from '@/components/os/advanced-search-filter';
import { SendersFilter } from '@/components/os/senders-filter';

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
  threadCount?: number;
  toAddresses?: any[];
};

export type FilterCategory = 'INBOX' | 'SENT' | 'CATEGORY_PROMOTIONS' | 'CATEGORY_SOCIAL' | 'CATEGORY_UPDATES' | 'ALL';

const CATEGORY_TABS: { id: FilterCategory; label: string }[] = [
  { id: 'ALL', label: 'All Mail' },
  { id: 'INBOX', label: 'Primary' },
  { id: 'SENT', label: 'Sent' },
  { id: 'CATEGORY_PROMOTIONS', label: 'Promotions' },
  { id: 'CATEGORY_SOCIAL', label: 'Social' },
  { id: 'CATEGORY_UPDATES', label: 'Updates' },
];

export function EmailListFull({ isSplitView = false }: { isSplitView?: boolean }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { activeTabs, emailCategory, setEmailCategory } = useAppStore();
  const setSelectedEmailId = useAppStore(state => state.setSelectedEmailId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 600);
  
  const [hoveredEmail, setHoveredEmail] = useState<EmailMessage | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const [openLabels, setOpenLabels] = useState(false);
  const [openQuickFilters, setOpenQuickFilters] = useState(false);

  const { data: labelsData } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const res = await fetch('/api/mail/labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    }
  });

  const formatLabelName = (name: string) => {
    if (!name) return '';
    if (name.startsWith('CATEGORY_')) {
      const clean = name.replace('CATEGORY_', '');
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    if (name === name.toUpperCase() && !name.includes('[')) {
      const clean = name.replace(/_/g, ' ');
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    return name;
  };

  const dynamicLabels = (labelsData?.labels || []).filter(
    (l: any) => !['INBOX', 'SENT', 'TRASH', 'UNREAD', 'STARRED', 'DRAFT', 'CHAT', 'YELLOW_STAR'].includes(l.id) && l.name !== 'YELLOW_STAR'
  );



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

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['emails', 'search', debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/mail/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error('Failed to search emails');
      const json = await res.json();
      return (json.messages || []) as EmailMessage[];
    },
    enabled: debouncedSearch.trim().length > 0
  });

  const isSearching = debouncedSearch.trim().length > 0;
  const rawEmails = isSearching ? (searchData || []) : (data?.pages.flat() || []);
  const emails = Array.from(new Map(rawEmails.map(e => [e.id, e])).values());
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
      
      let wasUnread = false;

      queryClient.setQueriesData({ queryKey: ['emails', 'threads'] }, (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: EmailMessage[]) => 
            page.map((m: EmailMessage) => {
              if (m.id === id && !m.isRead) {
                wasUnread = true;
                return { ...m, isRead: true };
              }
              return m;
            })
          )
        };
      });

      if (wasUnread) {
        queryClient.setQueryData(['emails', 'unread-count'], (old: any) => {
          if (!old || typeof old.count !== 'number') return old;
          return { count: Math.max(0, old.count - 1) };
        });
      }

      return { id };
    },
    onError: (err, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
    },
  });

  const trashMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mail/${id}/trash`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trash email');
      return { id };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['emails'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['emails', 'search'] });
    }
  });

  useEffect(() => {
    const newIds = emails.map(e => e.id);
    const currentIds = useAppStore.getState().currentEmailIds;
    if (newIds.length !== currentIds.length || newIds.some((id, i) => id !== currentIds[i])) {
      useAppStore.getState().setCurrentEmailIds(newIds);
    }
  }, [emails]);

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

  // Group emails logically by time
  const groupEmailsByDate = (emailsToGroup: EmailMessage[]) => {
    const groups: { [key: string]: EmailMessage[] } = {};
    const today = new Date();
    const last7Days = subDays(today, 7);

    emailsToGroup.forEach(email => {
      if (!email.date) return;
      const d = new Date(email.date);
      let title = '';

      if (isToday(d)) {
        title = 'Today';
      } else if (isYesterday(d)) {
        title = 'Yesterday';
      } else if (isAfter(d, last7Days)) {
        title = 'Last 7 days';
      } else if (isThisYear(d)) {
        title = format(d, 'MMMM');
      } else {
        title = format(d, 'yyyy');
      }

      if (!groups[title]) groups[title] = [];
      groups[title].push(email);
    });

    const orderedTitles = Array.from(new Set(emailsToGroup.map(email => {
      if (!email.date) return 'Unknown';
      const d = new Date(email.date);
      if (isToday(d)) return 'Today';
      if (isYesterday(d)) return 'Yesterday';
      if (isAfter(d, last7Days)) return 'Last 7 days';
      if (isThisYear(d)) return format(d, 'MMMM');
      return format(d, 'yyyy');
    })));

    return orderedTitles.map(title => ({
      title,
      emails: groups[title] || []
    }));
  };

  const groupedEmails = groupEmailsByDate(emails);

  return (
    <div className="flex h-full flex-col bg-bg-app flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex h-[60px] flex-shrink-0 items-center justify-between px-6 border-b border-border-subtle bg-bg-app">
        <div className="flex items-center gap-3 text-text-primary">
          {emailCategory === 'SENT' ? (
            <Send className="h-5 w-5 text-accent-blue" />
          ) : (
            <Archive className="h-5 w-5 text-accent-blue" />
          )}
          <h1 className="text-[20px] font-heading font-semibold">
            {emailCategory === 'SENT' ? 'Sent' : 'Inbox'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-bg-surface focus-within:border-accent-blue focus-within:ring-1 focus-within:ring-accent-blue transition-all w-[300px]">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] font-medium text-text-primary placeholder:text-text-muted w-full"
            />
            <AdvancedSearchFilter 
              currentQuery={searchQuery}
              onSearch={(q) => {
                const combined = [searchQuery.trim(), q.trim()].filter(Boolean).join(' ');
                setSearchQuery(combined);
              }}
            />
          </div>
          
          <SendersFilter 
            emails={rawEmails} 
            currentQuery={searchQuery}
            onSelectSender={(sender) => setSearchQuery(`from:${sender}`)}
            onClear={() => setSearchQuery('')}
          />
          
          <Popover open={openLabels} onOpenChange={setOpenLabels}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap">
                <Tag className="h-3.5 w-3.5" />
                Labels
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search label..." />
                <CommandList>
                  <CommandEmpty>No label found.</CommandEmpty>
                  <CommandGroup>
                    {dynamicLabels.map((label: any) => {
                      const displayName = formatLabelName(label.name);
                      const isSelected = emailCategory === label.id;
                      return (
                        <CommandItem
                          key={label.id}
                          value={displayName}
                          data-checked={isSelected}
                          onSelect={() => {
                            setEmailCategory(label.id);
                            setOpenLabels(false);
                          }}
                        >
                          {displayName}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={openQuickFilters} onOpenChange={setOpenQuickFilters}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default bg-bg-surface hover:bg-bg-highlight text-[13px] font-medium text-text-secondary transition-colors whitespace-nowrap" title="Filter">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Quick Filters
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 border-border-default shadow-xl rounded-xl" align="end">
              <Command>
                <CommandInput placeholder="Filter by..." />
                <CommandList>
                  <CommandEmpty>No filters found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSearchQuery('is:unread'); setOpenQuickFilters(false); }}>Is unread</CommandItem>
                    <CommandItem onSelect={() => { setSearchQuery('is:read'); setOpenQuickFilters(false); }}>Is read</CommandItem>
                    <CommandItem onSelect={() => { setSearchQuery('-in:sent'); setOpenQuickFilters(false); }}>Hide sent</CommandItem>
                    <CommandItem onSelect={() => { setSearchQuery('-in:inbox'); setOpenQuickFilters(false); }}>Show archived</CommandItem>
                    <CommandItem onSelect={() => { setSearchQuery('has:attachment'); setOpenQuickFilters(false); }}>Has attachments</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Categories Toolbar - Only show if not in SENT view */}
      {emailCategory !== 'SENT' && (
        <div className="flex-none px-4 py-2 border-b border-border-subtle bg-bg-surface/50 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEmailCategory(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-[13px] font-medium rounded-full whitespace-nowrap transition-colors",
                  emailCategory === tab.id 
                    ? "bg-accent-blue/10 text-accent-blue" 
                    : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email List Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
        {(isLoading && !isSearching) || (isSearching && isSearchLoading) ? (
          <div className="p-8 text-center text-text-muted">
            {isSearching ? 'Searching emails...' : 'Loading emails...'}
          </div>
        ) : error && !isSearching ? (
          <div className="p-8 text-center text-red-500">Failed to load emails.</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {isSearching ? 'No emails matched your search.' : 'No emails found. Please sync your inbox.'}
          </div>
        ) : (
          <div className="flex flex-col w-full pb-10">
            {groupedEmails.map(group => (
              <div key={group.title} className="mb-4">
                <div className="px-3 py-2 text-[14px] font-semibold text-text-primary sticky top-0 bg-bg-app z-10 opacity-90">
                  {group.title}
                </div>
                <div className="flex flex-col w-full">
                  {group.emails.map(email => {
                    const isChecked = selectedIds.includes(email.id);
                    let displaySender = email.sender ? email.sender.split('<')[0].replace(/["']/g, '').trim() : 'Unknown';
                    if (!displaySender && email.sender) {
                      displaySender = email.sender.replace(/[<>]/g, '').trim();
                    }
                    if (emailCategory === 'SENT') {
                      displaySender = `To: ${email.toAddresses?.map((t: any) => t.name || t.email).join(', ') || 'Unknown'}`;
                    }

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
                          "group relative flex items-center gap-3 px-3 py-2 border-transparent hover:bg-bg-surface/50 transition-colors cursor-pointer rounded-md",
                          !email.isRead && "bg-bg-surface/20",
                          isChecked && "bg-accent-blue/5"
                        )}
                      >
                        {/* Checkbox (visible on hover or when selected) */}
                        <div 
                          className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-6 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity", isChecked && "opacity-100")}
                          onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }}
                        >
                          {isChecked ? <CheckSquare className="h-4 w-4 text-accent-blue" /> : <Square className="h-4 w-4 text-text-muted hover:text-text-primary" />}
                        </div>

                        {/* Sender */}
                        <div className={cn("flex items-center gap-2 flex-shrink-0 transition-transform", isChecked || "group-hover:translate-x-6", isSplitView ? "w-[120px]" : "w-[200px]")}>
                          <span className={cn("truncate text-[14px]", !email.isRead ? "font-semibold text-text-primary" : "text-text-muted font-normal")}>
                            {displaySender} {email.threadCount && email.threadCount > 1 ? <span className="text-text-muted text-[12px] ml-1">{email.threadCount}</span> : null}
                          </span>
                        </div>

                        {/* Subject and Snippet */}
                        <div className="flex-1 flex items-center overflow-hidden gap-2">
                          <span className={cn("truncate text-[14px] flex-shrink-0", !email.isRead ? "font-semibold text-text-primary" : "text-text-muted font-normal")}>
                            {email.subject || '(No Subject)'}
                          </span>
                          <span className="truncate text-[14px] text-text-muted opacity-80">
                            {email.snippet}
                          </span>
                        </div>

                        {/* Actions & Date */}
                        <div className={cn("flex items-center gap-3 justify-end flex-shrink-0", isSplitView ? "w-[40px]" : "w-[120px]")}>
                          {/* Hover Actions */}
                          <div className={cn("hidden group-hover:flex items-center gap-2.5 text-text-secondary bg-bg-app px-2 absolute right-16", isSplitView && "right-[40px]")}>
                            <button className="hover:text-text-primary transition-colors" title="Archive" onClick={(e) => e.stopPropagation()}>
                              <Archive className="h-4 w-4" />
                            </button>
                            <button 
                              className="hover:text-destructive transition-colors" 
                              title="Delete" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                trashMutation.mutate(email.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="hover:text-text-primary transition-colors" title="Mark Read" onClick={(e) => e.stopPropagation()}>
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          </div>
                          {/* Date */}
                          {!isSplitView && (
                            <span className="text-[13px] font-medium text-text-muted group-hover:opacity-0 transition-opacity">
                              {formatDisplayDate(email.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
              
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
