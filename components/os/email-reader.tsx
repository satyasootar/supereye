'use client';

import { 
  ArrowLeft, Archive, Trash2, MoreVertical, Sparkles, 
  CornerUpLeft, CornerUpRight, Reply, Forward, Download,
  Bold, Italic, Underline, Link, List, Quote, Code, Heading,
  Paperclip, Calendar as CalendarIcon, Send, X, MailOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';

export function EmailReader() {
  const { selectedEmailId, setSelectedEmailId } = useAppStore();
  const [showComposer, setShowComposer] = useState(false);

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

  return (
    <div className="flex h-full flex-1 flex-col bg-bg-app overflow-hidden min-w-[400px]">
      {/* Thread Header */}
      <div className="flex flex-col border-b border-border-subtle bg-bg-base px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setSelectedEmailId(null)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-[13px] font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-bg-overlay hover:text-text-primary text-[13px] font-medium transition-colors border border-border-subtle">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archive</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-bg-overlay hover:text-destructive text-[13px] font-medium transition-colors border border-border-subtle">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button className="p-1.5 rounded-md text-text-secondary hover:bg-bg-overlay hover:text-text-primary transition-colors border border-border-subtle">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <h1 className="font-heading text-[22px] font-semibold text-text-primary mb-1">
            {email.subject || '(No Subject)'}
          </h1>
          <div className="flex items-center gap-2 text-[13px] text-text-secondary">
            <span>{email.fromName || email.fromAddress}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Updates
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Thread Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[700px] mx-auto flex flex-col gap-6">
          
          {/* Email Message Bubble */}
          <div className="flex flex-col rounded-xl bg-bg-surface border border-border-default overflow-hidden">
            {/* Message Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-border-subtle bg-bg-base/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-elevated border border-border-strong text-text-primary font-bold text-[14px]">
                  {email.fromName ? email.fromName.charAt(0).toUpperCase() : email.fromAddress.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-text-primary">{email.fromName || email.fromAddress}</span>
                    <span className="text-[12px] text-text-secondary">&lt;{email.fromAddress}&gt;</span>
                  </div>
                  <span className="text-[12.5px] text-text-secondary">
                    To: {email.toAddresses?.map((t: any) => t.email).join(', ') || 'Me'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-mono text-[12px] text-text-secondary">
                  {new Date(email.internalDate).toLocaleString()}
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="Reply">
                    <CornerUpLeft className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="Forward">
                    <CornerUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors" title="More">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Message Body */}
            <div className="px-5 py-6 text-[14px] leading-[1.6] text-text-primary font-sans bg-bg-base">
              {email.body ? (
                <div dangerouslySetInnerHTML={{ __html: email.body }} className="prose prose-sm dark:prose-invert max-w-none" />
              ) : (
                <p>{email.snippet}</p>
              )}
            </div>
            
            {/* Reply Bar (Trigger) */}
            {!showComposer && (
              <div className="px-5 py-3 border-t border-border-subtle bg-bg-surface flex items-center gap-2">
                <button 
                  onClick={() => setShowComposer(true)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-bg-elevated border border-border-default text-text-secondary text-[13.5px] hover:border-accent-blue transition-colors text-left"
                >
                  <Reply className="h-4 w-4" />
                  Reply to {email.fromName || email.fromAddress}...
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-elevated border border-border-default text-text-secondary text-[13.5px] hover:border-accent-blue transition-colors">
                  <Forward className="h-4 w-4" />
                  Forward
                </button>
              </div>
            )}
          </div>

          {/* Inline Composer (Active) */}
          {showComposer && (
            <div className="flex flex-col rounded-xl bg-bg-elevated border border-accent-blue shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-surface">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="font-medium text-text-secondary">To:</span>
                  <span className="font-medium text-text-primary px-2 py-0.5 rounded bg-bg-base border border-border-default">
                    {email.fromName || email.fromAddress} &lt;{email.fromAddress}&gt;
                  </span>
                </div>
                <button 
                  onClick={() => setShowComposer(false)}
                  className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4">
                <textarea 
                  autoFocus
                  placeholder="Draft your reply..."
                  className="w-full min-h-[150px] bg-transparent resize-none outline-none text-[14px] text-text-primary placeholder:text-text-muted"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center px-4 py-2 border-t border-border-subtle bg-bg-surface overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 mr-4 border-r border-border-subtle pr-4">
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><Bold className="h-4 w-4" /></button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><Italic className="h-4 w-4" /></button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><Underline className="h-4 w-4" /></button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><Link className="h-4 w-4" /></button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><List className="h-4 w-4" /></button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><Quote className="h-4 w-4" /></button>
                  <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded"><Code className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 bg-bg-surface border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors border border-transparent hover:border-border-default" title="Attach file">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-colors text-[13px] font-semibold border border-indigo-500/20" title="AI Draft">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Draft
                  </button>
                  <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors border border-transparent hover:border-border-default" title="Schedule send">
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-accent-blue text-white text-[13px] font-bold hover:bg-accent-blue-dim transition-colors shadow-sm">
                  Send
                  <span className="text-[10px] bg-white/20 px-1 rounded ml-1 font-mono">⌘↵</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
