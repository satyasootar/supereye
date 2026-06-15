'use client';

import {
  Archive, Trash2, MoreVertical, Sparkles,
  Reply, Forward, Download,
  CheckSquare, Printer, Clock, MoreHorizontal, ChevronUp, ChevronDown, ChevronsRight, MailOpen, X, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailComposer } from './email-composer';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function EmailReader() {
  const selectedEmailId = useAppStore(state => state.selectedEmailId);
  const setSelectedEmailId = useAppStore(state => state.setSelectedEmailId);
  const currentEmailIds = useAppStore(state => state.currentEmailIds);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const bottomRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const trashMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mail/${encodeURIComponent(id)}/trash`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trash email');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setSelectedEmailId(null);
    },
    onError: () => {}
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mail/${encodeURIComponent(id)}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive email');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setSelectedEmailId(null);
    },
    onError: () => {}
  });

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['email-thread', selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null;
      const res = await fetch(`/api/mail/thread/${encodeURIComponent(selectedEmailId)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch thread details');
      }
      const json = await res.json();
      return json.messages || [];
    },
    enabled: !!selectedEmailId,
    retry: false
  });

  useEffect(() => {
    // Reset reply state when selected thread changes
    setReplyMessageId(null);
  }, [selectedEmailId]);

  useEffect(() => {
    // Scroll to composer when opened
    if (replyMessageId && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [replyMessageId]);

  if (!selectedEmailId) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-bg-app overflow-hidden min-w-[400px]">
        <div className="text-center text-text-muted flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-bg-surface flex items-center justify-center">
            <MailOpen className="h-8 w-8 text-border-strong" />
          </div>
          <p>Select an email to read</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-app overflow-hidden min-w-[400px] p-6 animate-pulse">
        {/* Toolbar Header Skeleton */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6">
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-border-default/40 rounded-md" />
            <div className="h-8 w-16 bg-border-default/40 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-border-default/40 rounded-md" />
            <div className="h-8 w-8 bg-border-default/40 rounded-md" />
          </div>
        </div>

        {/* Email Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2.5 w-2/3">
            <div className="h-6 bg-border-default/50 rounded w-3/4" />
            <div className="h-4 bg-border-default/40 rounded w-1/2" />
          </div>
          <div className="h-4 bg-border-default/30 rounded w-20" />
        </div>

        {/* Email Body Skeleton */}
        <div className="space-y-4 flex-1">
          <div className="h-4 bg-border-default/35 rounded w-full" />
          <div className="h-4 bg-border-default/35 rounded w-[98%]" />
          <div className="h-4 bg-border-default/35 rounded w-[95%]" />
          <div className="h-4 bg-border-default/30 rounded w-[90%]" />
          <div className="h-4 bg-border-default/35 rounded w-[97%]" />
          <div className="h-4 bg-border-default/20 rounded w-[60%]" />
          
          <div className="h-6" /> {/* spacer */}
          
          <div className="h-4 bg-border-default/30 rounded w-[98%]" />
          <div className="h-4 bg-border-default/30 rounded w-[94%]" />
          <div className="h-4 bg-border-default/20 rounded w-[45%]" />
        </div>

        {/* Bottom Actions Skeleton */}
        <div className="flex gap-3 border-t border-border-subtle pt-6 mt-6">
          <div className="h-9 w-20 bg-border-default/40 rounded-md" />
          <div className="h-9 w-20 bg-border-default/40 rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !messages || messages.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-bg-app overflow-hidden min-w-[400px]">
        <div className="text-center text-red-500">Failed to load thread.</div>
      </div>
    );
  }

  const firstEmail = messages[0];
  const currentIndex = currentEmailIds.indexOf(selectedEmailId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < currentEmailIds.length - 1;

  const handlePrev = () => {
    if (hasPrev) setSelectedEmailId(currentEmailIds[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) setSelectedEmailId(currentEmailIds[currentIndex + 1]);
  };

  const extractRawEmail = (address: string) => {
    if (!address) return '';
    const match = address.match(/<([^>]+)>/);
    return match ? match[1] : address;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Find the main email body iframe
      const iframes = document.querySelectorAll('iframe');
      let bodyHtml = '';
      if (iframes.length > 0 && iframes[0].srcdoc) {
        bodyHtml = iframes[0].srcdoc;
      } else {
        bodyHtml = messages.map((m: any) => m.body || m.snippet).join('<br><hr><br>');
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${firstEmail.subject || 'Print Email'}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
              .header { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${firstEmail.subject || 'No Subject'}</h1>
              <p><strong>From:</strong> ${firstEmail.fromName || firstEmail.fromAddress}</p>
            </div>
            ${bodyHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Give images time to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleTrash = () => {
    if (firstEmail?.googleMessageId) {
      trashMutation.mutate(firstEmail.googleMessageId);
    }
  };

  const handleArchive = () => {
    if (firstEmail?.googleMessageId) {
      archiveMutation.mutate(firstEmail.googleMessageId);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-bg-app overflow-hidden min-w-[400px]">
      {/* Thread Header */}
      <div className="relative flex-shrink-0 border-b border-border-subtle bg-bg-base z-10">
        <AnimatePresence initial={false}>
          {isHeaderVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedEmailId(null)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors"
                      title="Close pane"
                    >
                      <ChevronsRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handlePrev}
                      disabled={!hasPrev}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Previous thread"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Next thread"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-text-secondary">
                    <button onClick={handlePrint} className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Print">
                      <Printer className="h-4 w-4" />
                    </button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Snooze">
                          <Clock className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1 border-border-subtle bg-bg-elevated shadow-xl rounded-xl" align="center" sideOffset={8}>
                        <div className="flex flex-col text-[13px] font-medium text-text-primary">
                          <div className="px-3 py-2 text-[12px] font-semibold text-text-muted uppercase tracking-wider">Snooze until</div>
                          <button className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-overlay transition-colors">
                            <span>Later today</span>
                            <span className="text-text-muted text-[12px]">6:00 PM</span>
                          </button>
                          <button className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-overlay transition-colors">
                            <span>Tomorrow</span>
                            <span className="text-text-muted text-[12px]">8:00 AM</span>
                          </button>
                          <button className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-overlay transition-colors">
                            <span>This weekend</span>
                            <span className="text-text-muted text-[12px]">Sat, 8:00 AM</span>
                          </button>
                          <button className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-overlay transition-colors">
                            <span>Next week</span>
                            <span className="text-text-muted text-[12px]">Mon, 8:00 AM</span>
                          </button>
                          <div className="h-[1px] bg-border-subtle my-1"></div>
                          <button className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-overlay transition-colors">
                            <span>Pick date & time</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Add to tasks">
                      <CheckSquare className="h-4 w-4" />
                    </button>
                    <button onClick={handleArchive} disabled={archiveMutation.isPending} className={cn("p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors", archiveMutation.isPending && "opacity-50")} title="Archive">
                      {archiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                    </button>
                    <button onClick={handleTrash} disabled={trashMutation.isPending} className={cn("p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors", trashMutation.isPending && "opacity-50")} title="Trash">
                      {trashMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="More">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h1 className="font-heading text-[22px] font-semibold text-text-primary mb-3">
                    {firstEmail.subject || '(No Subject)'}
                  </h1>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          className={cn(
            "absolute right-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary hover:bg-bg-surface shadow-sm transition-colors",
            isHeaderVisible ? "-bottom-3" : "top-3"
          )}
          title={isHeaderVisible ? "Hide header" : "Show header"}
        >
          {isHeaderVisible ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Scrollable Thread Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
        <div className="max-w-[700px] mx-auto flex flex-col gap-6">
          
          {messages.map((email: any, index: number) => {
            const senderString = email.sender || email.fromAddress || '';
            const match = senderString.match(/(?:(.*)\s+)?<([^>]+)>/);
            
            let cleanFromName = senderString;
            let rawFromAddress = senderString;
            
            if (match) {
              cleanFromName = match[1] ? match[1].replace(/["']/g, '').trim() : match[2];
              rawFromAddress = match[2];
            }

            if (email.fromName) {
              cleanFromName = email.fromName.replace(/<[^>]+>/g, '').replace(/"/g, '').trim();
            }

            const isLast = index === messages.length - 1;
            const isReplyingToThis = replyMessageId === email.id;

            return (
              <div key={email.id} className="flex flex-col pt-4 pb-2 border-b border-white/5 last:border-b-0">
                {/* Message Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-text-primary">{cleanFromName}</span>
                      {rawFromAddress !== cleanFromName && (
                        <span className="text-[13px] text-text-secondary">&lt;{rawFromAddress}&gt;</span>
                      )}
                    </div>
                    <span className="text-[13px] text-text-secondary">
                      To: {email.toAddresses?.map((t: any) => t.name ? t.name : t.email).join(', ') || 'me'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-text-secondary font-medium whitespace-nowrap">
                      {new Date(email.internalDate).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setReplyMessageId(email.id)} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="Reply">
                        <Reply className="h-4 w-4" />
                      </button>
                      <button onClick={() => setReplyMessageId(email.id)} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="Forward">
                        <Forward className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="py-4 text-[14px] leading-[1.6] text-text-primary font-sans">
                  {email.body ? (
                    <iframe
                      srcDoc={`<style>
                                    :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
                                    body, html { 
                                      background-color: transparent !important; 
                                      color: ${isDark ? '#F2F4F7' : '#1A1D24'} !important; 
                                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                                      line-height: 1.6; 
                                      word-wrap: break-word; 
                                      margin: 0; 
                                      padding: 0; 
                                      -ms-overflow-style: none;
                                      scrollbar-width: none;
                                    }
                                    body::-webkit-scrollbar, html::-webkit-scrollbar { display: none; }
                                    * { background-color: transparent !important; color: ${isDark ? '#F2F4F7' : '#1A1D24'} !important; border-color: ${isDark ? '#2A2D35' : '#E2E8F0'} !important; }
                                    a { color: #3b82f6 !important; }
                                    img { background-color: transparent !important; max-width: 100%; height: auto; }
                                  </style>${email.body}`}
                      className="w-full min-h-[150px] border-none bg-transparent"
                      sandbox=""
                      title="Email message body"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-text-secondary">{email.snippet}</p>
                  )}
                </div>

                {/* Inline Actions (shown only if this isn't the one being actively replied to) */}
                {!isReplyingToThis && (
                  <div className="pt-2 pb-4 flex items-center gap-3">
                    <button
                      onClick={() => setReplyMessageId(email.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-accent-blue/30 text-accent-blue text-[13px] hover:bg-bg-highlight/50 hover:border-accent-blue/60 transition-colors shadow-sm bg-bg-app cursor-pointer"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                    <button
                      onClick={() => setReplyMessageId(email.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-accent-blue/30 text-accent-blue text-[13px] hover:bg-bg-highlight/50 hover:border-accent-blue/60 transition-colors shadow-sm bg-bg-app cursor-pointer"
                    >
                      <Forward className="h-4 w-4" />
                      Forward
                    </button>
                  </div>
                )}

                {/* Inline Composer (rendered exactly inside the message it replies to) */}
                {isReplyingToThis && (
                  <div className="pt-2 pb-4">
                    <EmailComposer
                      onClose={() => setReplyMessageId(null)}
                      defaultTo={email.fromAddress}
                      emailId={email.googleMessageId}
                      threadId={email.threadId}
                      subject={email.subject}
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}
