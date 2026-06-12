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
import { EmailComposer } from './email-composer';

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
  const cleanFromName = email.fromName ? email.fromName.replace(/<[^>]+>/g, '').replace(/"/g, '').trim() : email.fromAddress;

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
          <div className="flex flex-col">
            {/* Message Header */}
            <div className="flex items-start justify-between py-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-elevated border border-border-strong text-text-primary font-bold text-[14px]">
                  {email.fromName ? email.fromName.charAt(0).toUpperCase() : email.fromAddress.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-text-primary">{cleanFromName || email.fromAddress}</span>
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
            <div className="py-6 text-[14px] leading-[1.6] text-text-primary font-sans">
              {email.body ? (
                <div dangerouslySetInnerHTML={{ __html: email.body }} className="prose prose-sm dark:prose-invert max-w-none" />
              ) : (
                <p dangerouslySetInnerHTML={{ __html: email.snippet }} />
              )}
            </div>
          </div>
          
          {/* Action Triggers / Composer */}
          {!showComposer ? (
            <div className="flex items-center gap-3 mt-4">
              <button 
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-strong text-text-primary text-[14px] hover:bg-bg-surface transition-colors shadow-sm bg-bg-base"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-strong text-text-primary text-[14px] hover:bg-bg-surface transition-colors shadow-sm bg-bg-base"
              >
                <Forward className="h-4 w-4" />
                Forward
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
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
