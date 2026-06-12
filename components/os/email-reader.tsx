'use client';

import {
  ArrowLeft, Archive, Trash2, MoreVertical, Sparkles,
  CornerUpLeft, CornerUpRight, Reply, Forward, Download,
  Bold, Italic, Underline, Link, List, Quote, Code, Heading,
  Paperclip, Calendar as CalendarIcon, Send, X, MailOpen,
  ChevronsRight, ChevronUp, ChevronDown, Printer, Clock, CheckSquare, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import { EmailComposer } from './email-composer';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

export function EmailReader() {
  const selectedEmailId = useAppStore(state => state.selectedEmailId);
  const setSelectedEmailId = useAppStore(state => state.setSelectedEmailId);
  const currentEmailIds = useAppStore(state => state.currentEmailIds);
  const [showComposer, setShowComposer] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { data, isLoading, error } = useQuery({
    queryKey: ['email', selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null;
      const res = await fetch(`/api/mail/${encodeURIComponent(selectedEmailId)}`);
      if (!res.ok) {
        const errText = await res.text();
        console.error('Email fetch failed:', res.status, errText);
        throw new Error('Failed to fetch email details');
      }
      const json = await res.json();
      return json.message;
    },
    enabled: !!selectedEmailId,
    retry: false
  });

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
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-bg-app overflow-hidden min-w-[400px]">
        <div className="text-center text-text-muted">Loading email...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-bg-app overflow-hidden min-w-[400px]">
        <div className="text-center text-red-500">Failed to load email.</div>
      </div>
    );
  }

  const email = data;
  const extractRawEmail = (address: string) => {
    if (!address) return '';
    const match = address.match(/<([^>]+)>/);
    return match ? match[1] : address;
  };
  const rawFromAddress = extractRawEmail(email.fromAddress);
  const cleanFromName = email.fromName ? email.fromName.replace(/<[^>]+>/g, '').replace(/"/g, '').trim() : rawFromAddress;

  const currentIndex = currentEmailIds.indexOf(selectedEmailId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < currentEmailIds.length - 1;

  const handlePrev = () => {
    if (hasPrev) setSelectedEmailId(currentEmailIds[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) setSelectedEmailId(currentEmailIds[currentIndex + 1]);
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
                      title="Previous email"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Next email"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-text-secondary">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/5 bg-bg-surface hover:bg-bg-overlay hover:text-text-primary text-[13px] font-medium transition-colors mr-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">Auto label similar</span>
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Print">
                      <Printer className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Snooze">
                      <Clock className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Add to tasks">
                      <CheckSquare className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Archive">
                      <Archive className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Trash">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="More">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h1 className="font-heading text-[22px] font-semibold text-text-primary mb-3">
                    {email.subject || '(No Subject)'}
                  </h1>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Header Visibility Button */}
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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[700px] mx-auto flex flex-col gap-6">

          {/* Email Message Bubble */}
          <div className="flex flex-col">
            {/* Message Header */}
            <div className="flex items-start justify-between py-4 border-b border-border-subtle">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-text-primary">{cleanFromName}</span>
                  {rawFromAddress !== cleanFromName && (
                    <span className="text-[13px] text-text-secondary">{rawFromAddress}</span>
                  )}
                </div>
                <span className="text-[13px] text-text-secondary">
                  To {email.toAddresses?.map((t: any) => t.name ? t.name.toUpperCase() : t.email).join(', ') || 'ME'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowComposer(true)} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="Reply">
                    <Reply className="h-4 w-4" />
                  </button>
                  <button onClick={() => setShowComposer(true)} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="Forward">
                    <Forward className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-[13px] text-text-secondary font-medium whitespace-nowrap">
                  {new Date(email.internalDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div className="py-6 text-[14px] leading-[1.6] text-text-primary font-sans h-full min-h-[500px]">
              {email.body ? (
                <iframe
                  srcDoc={`<style>
                                :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
                                body, html { 
                                  background-color: ${isDark ? '#0D0E12' : '#FFFFFF'} !important; 
                                  color: ${isDark ? '#F2F4F7' : '#1A1D24'} !important; 
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                                  line-height: 1.6; 
                                  word-wrap: break-word; 
                                  margin: 0; 
                                  padding: 0; 
                                  -ms-overflow-style: none;  /* IE and Edge */
                                  scrollbar-width: none;  /* Firefox */
                                }
                                body::-webkit-scrollbar, html::-webkit-scrollbar { 
                                  display: none; 
                                }
                                * { background-color: ${isDark ? '#0D0E12' : '#FFFFFF'} !important; color: ${isDark ? '#F2F4F7' : '#1A1D24'} !important; border-color: ${isDark ? '#2A2D35' : '#E2E8F0'} !important; }
                                a { color: #3b82f6 !important; }
                                img { background-color: transparent !important; }
                              </style>${email.body}`}
                  className="w-full h-full min-h-[800px] border-none bg-transparent"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                />
              ) : (
                <p dangerouslySetInnerHTML={{ __html: email.snippet }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Triggers / Composer - Sticky Footer */}
      <div className="flex-shrink-0 border-t border-border-subtle bg-bg-base px-6 py-4">
        <div className="max-w-[700px] mx-auto w-full">
          {!showComposer ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-strong text-text-primary text-[14px] hover:bg-bg-surface transition-colors shadow-sm bg-bg-app"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-strong text-text-primary text-[14px] hover:bg-bg-surface transition-colors shadow-sm bg-bg-app"
              >
                <Forward className="h-4 w-4" />
                Forward
              </button>
            </div>
          ) : (
            <div>
              <EmailComposer
                onClose={() => setShowComposer(false)}
                defaultTo={email.fromAddress}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
