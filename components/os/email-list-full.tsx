'use client';

import { 
  Menu, Filter, Tag, CheckCircle2, SlidersHorizontal, Square, 
  CheckSquare, Archive, Trash2, Calendar, MessageSquare, 
  MoreHorizontal, ChevronDown, Plus, Search, Send, X, FileText, Inbox,
  AlertCircle, Loader2, Sparkles
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
import { EmailPriorityBadge } from '@/components/os/email-priority-badge';
import { EmailFetchPatienceNotice } from '@/components/os/email-fetch-patience-notice';
import type { EmailPriorityTier } from '@/lib/mail/priority';
import { useSlowLoadingNotice } from '@/lib/hooks/use-slow-loading-notice';

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
  priorityTier?: EmailPriorityTier | null;
  priorityScore?: number | null;
  priorityReason?: string | null;
  priorityClassifiedAt?: string | null;
};

export type FilterCategory = 'INBOX' | 'SENT' | 'CATEGORY_PROMOTIONS' | 'CATEGORY_SOCIAL' | 'CATEGORY_UPDATES' | 'ALL';

const CATEGORY_TABS: { id: FilterCategory; label: string }[] = [
  { id: 'INBOX', label: 'Primary' },
  { id: 'CATEGORY_PROMOTIONS', label: 'Promotions' },
  { id: 'CATEGORY_SOCIAL', label: 'Social' },
  { id: 'CATEGORY_UPDATES', label: 'Updates' },
];

function buildPeekIframeHtml(body: string, isDark: boolean): string {
  const isPlain = !/<[a-z][\s\S]*>/i.test(body);
  const bg = isDark ? '#0d0f0e' : '#ffffff';
  const text = isDark ? '#d4d5d4' : '#2f3c34';
  const muted = isDark ? '#a0a8a3' : '#526257';
  const accent = isDark ? '#6e8e78' : '#5a775c';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
    html, body {
      margin: 0;
      padding: 14px 16px;
      background: ${bg} !important;
      color: ${text} !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      word-wrap: break-word;
      overflow-x: hidden;
      ${isPlain ? 'white-space: pre-wrap;' : ''}
    }
    img { display: block; max-width: 100% !important; height: auto !important; background: transparent !important; }
    table { max-width: 100% !important; width: 100% !important; table-layout: fixed !important; }
    td, th { word-wrap: break-word; overflow-wrap: anywhere; }
    a { color: ${accent} !important; text-decoration: none; }
    h1, h2, h3, h4, h5, h6 {
      font-size: 14px !important;
      line-height: 1.35 !important;
      font-weight: 600 !important;
      margin: 0 0 8px !important;
      color: ${isDark ? '#f5f5f5' : '#111613'} !important;
    }
    p, li {
      font-size: 13px !important;
      line-height: 1.55 !important;
      margin: 0 0 10px !important;
    }
  </style></head><body>${body}</body></html>`;
}

export function EmailListFull({ isSplitView = false }: { isSplitView?: boolean }) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const {
    activeTabs,
    emailCategory,
    setEmailCategory,
    emailPriorityFilter,
    setEmailPriorityFilter,
    selectedEmailId,
    setSelectedEmailId,
    activeWorkspaceId,
  } = useAppStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 600);
  
  const [hoveredEmail, setHoveredEmail] = useState<EmailMessage | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const [openLabels, setOpenLabels] = useState(false);
  const [openQuickFilters, setOpenQuickFilters] = useState(false);
  
  const [dismissedCount, setDismissedCount] = useState<number>(0);

  // Load dismissed count from localStorage
  const getDismissedCount = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    const key = activeWorkspaceId ? `dismissedUrgentCount_${activeWorkspaceId}` : 'dismissedUrgentCount_global';
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  }, [activeWorkspaceId]);

  useEffect(() => {
    setDismissedCount(getDismissedCount());
  }, [getDismissedCount, activeWorkspaceId]);
  const triageRequestedRef = useRef(false);

  const { data: labelsData } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const res = await fetch('/api/mail/labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    }
  });

  const { data: unreadData } = useQuery({
    queryKey: ['emails', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/mail/unread');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 30000,
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
    refetchInterval: 30000,
  });

  const triageMutation = useMutation({
    mutationFn: async (messageIds?: string[]) => {
      const res = await fetch('/api/mail/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10, messageIds }),
      });
      if (!res.ok) throw new Error('Failed to classify emails');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['emails', 'triage'] });
    },
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
    queryKey: ['emails', 'threads', emailCategory, emailPriorityFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = emailCategory === 'DRAFT' 
        ? `/api/mail/drafts` 
        : `/api/mail/threads?offset=${pageParam}&category=${encodeURIComponent(emailCategory)}${
            emailPriorityFilter !== 'all'
              ? `&priority=${encodeURIComponent(emailPriorityFilter)}`
              : ''
          }`;
      
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
  const isInitialLoading = (isLoading && !isSearching) || (isSearching && isSearchLoading);
  const showSlowFetchNotice = useSlowLoadingNotice(isLoading && !isSearching);
  const rawEmails = isSearching ? (searchData || []) : (data?.pages.flat() || []);
  const emails = Array.from(new Map(rawEmails.map(e => [e.id, e])).values()).filter((email) => {
    if (isSearching || emailPriorityFilter === 'all') return true;
    return email.priorityTier === emailPriorityFilter;
  });

  const showPriorityUi = ['ALL', 'INBOX', 'CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_UPDATES'].includes(emailCategory);
  const urgentCount = triageData?.urgent ?? emails.filter((e) => e.priorityTier === 'urgent' && !e.isRead).length;
  const urgentBannerDismissed = urgentCount <= dismissedCount;

  useEffect(() => {
    const navigate = (delta: number) => {
      if (emails.length === 0) return;
      const idx = emails.findIndex((e) => e.id === selectedEmailId);
      const nextIdx =
        idx < 0
          ? delta > 0
            ? 0
            : emails.length - 1
          : Math.min(emails.length - 1, Math.max(0, idx + delta));
      setSelectedEmailId(emails[nextIdx].id);
    };

    const onCategory = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setEmailCategory(detail as FilterCategory);
    };

    const handlers: Record<string, EventListener> = {
      'supereye:email-next': () => navigate(1),
      'supereye:email-prev': () => navigate(-1),
      'supereye:email-open': () => {
        if (selectedEmailId) return;
        if (emails[0]) setSelectedEmailId(emails[0].id);
      },
      'supereye:email-focus-search': () => searchInputRef.current?.focus(),
      'supereye:email-category': onCategory,
      'supereye:email-archive': () => {
        if (selectedEmailId) {
          fetch(`/api/mail/${encodeURIComponent(selectedEmailId)}/archive`, {
            method: 'POST',
          }).then(() => queryClient.invalidateQueries({ queryKey: ['emails'] }));
        }
      },
      'supereye:email-delete': () => {
        if (selectedEmailId) {
          fetch(`/api/mail/${encodeURIComponent(selectedEmailId)}/trash`, {
            method: 'POST',
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            setSelectedEmailId(null);
          });
        }
      },
      'supereye:email-reply': () => {
        if (selectedEmailId) {
          window.dispatchEvent(
            new CustomEvent('supereye:email-reply-open', {
              detail: selectedEmailId,
            })
          );
        }
      },
      'supereye:email-mark': (e) => {
        const { read } = (e as CustomEvent<{ read: boolean }>).detail ?? {};
        if (!selectedEmailId || read !== true) return;
        fetch(`/api/mail/${encodeURIComponent(selectedEmailId)}/read`, {
          method: 'POST',
        }).then(() => queryClient.invalidateQueries({ queryKey: ['emails'] }));
      },
    };

    for (const [event, handler] of Object.entries(handlers)) {
      window.addEventListener(event, handler);
    }
    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        window.removeEventListener(event, handler);
      }
    };
  }, [
    emails,
    selectedEmailId,
    setSelectedEmailId,
    setEmailCategory,
    queryClient,
  ]);

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

  const bulkTrashMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/mail/${id}/trash`, { method: 'POST' });
          if (!res.ok) throw new Error(`Failed to trash email ${id}`);
        })
      );
      return ids;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['emails', 'search'] });
      setSelectedIds([]); // Clear selection after deletion
    }
  });

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      bulkTrashMutation.mutate(selectedIds);
    }
  };

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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-bg-app">
      {/* Header */}
      <div className="flex h-[60px] flex-shrink-0 items-center justify-between px-6 border-b border-border-subtle bg-bg-app">
        <div className="flex items-center gap-3 text-text-primary">
          {(() => {
            let Icon = Inbox;
            let title = 'Inbox';
            
            if (emailCategory === 'SENT') {
              Icon = Send;
              title = 'Sent';
            } else if (emailCategory === 'TRASH') {
              Icon = Trash2;
              title = 'Trash';
            } else if (emailCategory === 'DRAFT') {
              Icon = FileText;
              title = 'Drafts';
            } else if (emailCategory === 'ALL') {
              Icon = Archive;
              title = 'All Mail';
            }
            
            return (
              <>
                <Icon className="h-5 w-5 text-accent-blue" />
                <h1 className="text-[20px] font-heading font-semibold">{title}</h1>
              </>
            );
          })()}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-bg-surface focus-within:border-accent-blue focus-within:ring-1 focus-within:ring-accent-blue transition-all w-[300px]">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input
              ref={searchInputRef}
              type="text" 
              placeholder="Search emails..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] font-medium text-text-primary placeholder:text-text-muted w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-highlight transition-colors flex-shrink-0"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
            onSelectSenders={(senders) => {
              let q = searchQuery;
              // Strip out any existing from: blocks
              q = q.replace(/\{?from:[^\s}]+\}?/g, '').replace(/\s+/g, ' ').trim();
              if (senders.length > 0) {
                 const fromPart = senders.map(s => `from:${s}`).join(' ');
                 q = (q ? q + ' ' : '') + (senders.length > 1 ? `{${fromPart}}` : fromPart);
              }
              setSearchQuery(q.trim());
            }}
            onClear={() => {
              const q = searchQuery.replace(/\{?from:[^\s}]+\}?/g, '').replace(/\s+/g, ' ').trim();
              setSearchQuery(q);
            }}
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
                {searchQuery && (
                  <div className="p-2 border-t border-border-subtle">
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setOpenQuickFilters(false);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-bg-highlight rounded-md transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Categories Toolbar - Only show in INBOX and its sub-categories */}
      {showPriorityUi && (
        <div className="flex-none px-4 py-2 border-b border-border-subtle bg-bg-surface/50 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {CATEGORY_TABS.map((tab) => {
                const unreadCount = unreadData?.categories?.[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setEmailCategory(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-full whitespace-nowrap transition-colors",
                      emailCategory === tab.id 
                        ? "bg-accent-blue/10 text-accent-blue" 
                        : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                    )}
                  >
                    {tab.label}
                    {unreadCount > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[11px] leading-none font-bold",
                        emailCategory === tab.id
                          ? "bg-accent-blue text-white"
                          : "bg-border-subtle text-text-secondary"
                      )}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const unclassifiedIds = emails.filter(e => !e.priorityTier).map(e => e.id);
                  if (unclassifiedIds.length > 0) triageMutation.mutate(unclassifiedIds);
                }}
                disabled={triageMutation.isPending || emails.filter(e => !e.priorityTier).length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-text-secondary hover:bg-bg-elevated hover:text-text-primary rounded-full cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Run AI Triage on loaded emails"
              >
                {triageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Run Triage</span>
              </button>
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  disabled={bulkTrashMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-destructive hover:bg-destructive/10 rounded-full cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move selected to Trash"
                >
                  {bulkTrashMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{bulkTrashMutation.isPending ? 'Deleting...' : `Delete (${selectedIds.length})`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPriorityUi && urgentCount > 0 && emailPriorityFilter !== 'urgent' && !urgentBannerDismissed && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-[color:var(--priority-urgent)]/25 bg-[color:var(--priority-urgent)]/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-[color:var(--priority-urgent)]" />
          <p className="flex-1 text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">{urgentCount} urgent</span>
            {' '}email{urgentCount === 1 ? '' : 's'} need attention.
          </p>
          <button
            onClick={() => setEmailPriorityFilter('urgent')}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-[color:var(--priority-urgent)] hover:bg-[color:var(--priority-urgent)]/10 transition-colors"
          >
            View urgent
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const key = activeWorkspaceId ? `dismissedUrgentCount_${activeWorkspaceId}` : 'dismissedUrgentCount_global';
                localStorage.setItem(key, urgentCount.toString());
              }
              setDismissedCount(urgentCount);
            }}
            className="rounded-md p-1.5 text-text-muted hover:bg-[color:var(--priority-urgent)]/10 hover:text-[color:var(--priority-urgent)] transition-colors"
            title="Dismiss"
            aria-label="Dismiss urgent alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Email List Content */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {isInitialLoading ? (
          showSlowFetchNotice ? (
            <EmailFetchPatienceNotice className="mt-8" />
          ) : (
            <div className="flex flex-col w-full animate-pulse gap-1">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 px-3 py-3 border-l-2 border-transparent border-b border-border-subtle/25"
                >
                  {/* Checkbox Skeleton */}
                  <div className="h-4 w-4 bg-border-default/40 rounded flex-shrink-0" />
                  {/* Sender Skeleton */}
                  <div className={cn("h-4 bg-border-default/40 rounded flex-shrink-0", isSplitView ? "w-[120px]" : "w-[200px]")} />
                  {/* Subject & Snippet Skeleton */}
                  <div className="flex-1 flex gap-2 overflow-hidden">
                    <div className="h-4 bg-border-default/45 rounded w-1/3 flex-shrink-0" />
                    <div className="h-4 bg-border-default/20 rounded w-1/2 flex-shrink-0 hidden md:block" />
                  </div>
                  {/* Date Skeleton */}
                  <div className="w-12 h-3.5 bg-border-default/30 rounded flex-shrink-0" />
                </div>
              ))}
            </div>
          )
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
                    const isSelected = selectedEmailId === email.id;
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
                          "group relative flex items-center gap-3 px-3 py-2 border-l-2 transition-colors cursor-pointer rounded-r-md",
                          isSelected 
                            ? "bg-bg-highlight border-accent-blue text-text-primary" 
                            : "border-transparent text-text-secondary hover:bg-bg-overlay",
                          !email.isRead && !isSelected && "bg-bg-surface/40",
                          isChecked && "bg-accent-blue/5"
                        )}
                      >
                        {/* Left section: Checkbox (optional) + Sender */}
                        <div className={cn("flex items-center flex-shrink-0", isSplitView ? "w-[120px]" : "w-[200px]")}>
                          <div 
                            className={cn(
                              "flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0", 
                              (isChecked || isSelected) 
                                ? "w-5 opacity-100 mr-2" 
                                : "w-0 opacity-0 mr-0 group-hover:w-5 group-hover:opacity-100 group-hover:mr-2"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }}
                          >
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {isChecked ? <CheckSquare className="h-4 w-4 text-accent-blue" /> : <Square className="h-4 w-4 text-text-muted hover:text-text-primary" />}
                            </div>
                          </div>
                          <span className={cn("truncate min-w-0 text-[14px] flex-1 transition-all duration-300 ease-in-out", !email.isRead ? "font-semibold text-text-primary" : "text-text-muted font-normal")}>
                            {displaySender} {email.threadCount && email.threadCount > 1 ? <span className="text-text-muted text-[12px] ml-1">{email.threadCount}</span> : null}
                          </span>
                        </div>

                        {/* Subject and Snippet */}
                        <div className="flex-1 flex items-center overflow-hidden gap-2 min-w-0">
                          {email.priorityTier && (
                            <EmailPriorityBadge
                              tier={email.priorityTier}
                              reason={email.priorityReason}
                              compact
                              className="flex-shrink-0"
                            />
                          )}
                          <span className={cn("truncate text-[14px] flex-shrink-0 max-w-[40%]", !email.isRead ? "font-semibold text-text-primary" : "text-text-muted font-normal")}>
                            {email.subject || '(No Subject)'}
                          </span>
                          <span className="truncate text-[14px] text-text-muted opacity-80 min-w-0">
                            {email.snippet}
                          </span>
                        </div>

                        {/* Actions & Date */}
                        <div className={cn("flex items-center gap-3 justify-end flex-shrink-0", isSplitView ? "w-[40px]" : "w-[120px]")}>
                          {/* Date */}
                          {!isSplitView && (
                            <span className="text-[13px] font-medium text-text-muted">
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
          className="pointer-events-none fixed z-[100] w-[380px] overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-2xl animate-in fade-in zoom-in-95"
          style={{
            left: Math.min(mousePos.x + 20, typeof window !== 'undefined' ? window.innerWidth - 400 : mousePos.x + 20),
            top:
              typeof window !== 'undefined'
                ? Math.min(Math.max(mousePos.y + 16, 16), window.innerHeight - 320)
                : mousePos.y + 16,
          }}
        >
          <div className="relative h-[280px] overflow-hidden bg-bg-base">
            {hoveredEmail.body ? (
              <iframe
                title="Email preview"
                srcDoc={buildPeekIframeHtml(hoveredEmail.body, isDark)}
                className="h-full w-full border-0 bg-transparent"
                sandbox=""
                scrolling="no"
              />
            ) : (
              <p className="line-clamp-[12] whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed text-text-secondary">
                {hoveredEmail.snippet}
              </p>
            )}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg-elevated to-transparent"
              aria-hidden
            />
          </div>
        </div>
      )}
    </div>
  );
}
